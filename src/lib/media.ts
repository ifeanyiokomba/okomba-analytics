/* ─────────────────────────────────────────────────────────────
   Media — SERVER-ONLY upload pipeline (directive §20 media
   storage, §21 photo upload experience, §25 post attachments,
   §93 file security).

   ⚠ Node-only module: imports sharp + cloudinary. Never import
   from a client component — the client-safe types/helpers live
   in ./media-shared.

   Security contract (§93) — enforced for EVERY upload:
   • declared MIME must be on the allowlist
   • size must be under the per-kind cap (checked BEFORE reading
     the body into memory)
   • magic bytes must match the declared MIME (clients can lie)
   • client filename is sanitized and used for DISPLAY ONLY —
     storage keys are generated (uuid) server-side
   • files live under data/uploads/media/ (outside executable
     code dirs, gitignored) and are streamed back through
     /api/media/{id} with the recorded content-type

   Optimization (§20): images are resized to ≤1920px wide (no
   upscale) and transcoded to WebP q82 by sharp; a 480px thumb
   is generated for galleries. Videos/PDFs pass through (sharp
   can't re-encode them) — their size caps are the guard.
   Cloudinary is used for images when configured; everything
   else stays local (the local path is the always-works default).
   ───────────────────────────────────────────────────────────── */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { v2 as cloudinarySdk } from "cloudinary";
import { db } from "@/lib/db";
import { sanitizeFilename, kindOfMime, MEDIA_CAPS, type MediaKind } from "./media-shared";

export * from "./media-shared";

/* ── Magic-byte sniffing (never trust the client) ───────── */

function magicMatches(mime: string, buf: Buffer): boolean {
  const starts = (sig: number[], offset = 0) =>
    sig.every((b, i) => buf[offset + i] === b);
  const ascii = (s: string, offset = 0) => {
    for (let i = 0; i < s.length; i++) if (buf[offset + i] !== s.charCodeAt(i)) return false;
    return true;
  };

  switch (mime) {
    case "image/jpeg":
      return starts([0xff, 0xd8, 0xff]);
    case "image/png":
      return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return ascii("GIF87a") || ascii("GIF89a");
    case "image/webp":
      return ascii("RIFF") && ascii("WEBP", 8);
    case "image/avif":
      // ftyp box at offset 4 with an avif/avis brand
      return ascii("ftyp", 4) && (ascii("avif", 8) || ascii("avis", 8));
    case "video/mp4":
      return ascii("ftyp", 4);
    case "video/webm":
      return starts([0x1a, 0x45, 0xdf, 0xa3]);
    case "application/pdf":
      return ascii("%PDF");
    default:
      return false;
  }
}

/* ── Local storage ───────────────────────────────────────── */

const MEDIA_DIR = path.join(process.cwd(), "data", "uploads", "media");

async function storeLocal(storedName: string, buffer: Buffer): Promise<void> {
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_DIR, storedName), buffer);
}

export async function readMediaFile(storedName: string): Promise<Buffer> {
  const resolved = path.resolve(MEDIA_DIR, storedName);
  if (!resolved.startsWith(path.resolve(MEDIA_DIR) + path.sep)) {
    throw new Error("invalid storage key");
  }
  return readFile(resolved);
}

/* ── Cloudinary (images only, optional) ──────────────────── */

function cloudName(): string | null {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const m = url.match(/^cloudinary:\/\/[^@]+@([^/?]+)/);
    if (m?.[1]) return m[1];
  }
  return process.env.CLOUDINARY_CLOUD_NAME || null;
}

let cloudinaryConfigured = false;
function cloudinaryClient() {
  if (!cloudinaryConfigured) {
    if (process.env.CLOUDINARY_URL) {
      cloudinarySdk.config(true);
    } else {
      cloudinarySdk.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
    cloudinaryConfigured = true;
  }
  return cloudinarySdk;
}

/* ── Upload pipeline ─────────────────────────────────────── */

export type MediaUploadResult =
  | {
      ok: true;
      asset: {
        id: string;
        kind: MediaKind;
        url: string;
        thumbUrl: string | null;
        originalName: string;
        bytes: number;
        mime: string;
        width: number | null;
        height: number | null;
        storage: "local" | "cloudinary";
      };
    }
  | { ok: false; error: string; status: number };

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

export async function saveMediaUpload(file: File): Promise<MediaUploadResult> {
  // 1) Declared MIME allowlist
  const mime = file.type || "";
  const kind = kindOfMime(mime);
  if (!kind) {
    return { ok: false, error: `Unsupported file type: ${mime || "unknown"}`, status: 415 };
  }

  // 2) Size cap BEFORE reading the body into memory
  if (file.size > MEDIA_CAPS[kind]) {
    return {
      ok: false,
      error: `File exceeds the ${Math.round(MEDIA_CAPS[kind] / (1024 * 1024))} MB ${kind} limit`,
      status: 413,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: "Empty file", status: 400 };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 3) Magic bytes must match the declared MIME
  if (!magicMatches(mime, buffer)) {
    return { ok: false, error: "File content does not match its declared type", status: 415 };
  }

  const originalName = sanitizeFilename(file.name || "file");

  try {
    /* ── Images: optimized + thumb (§20) ── */
    if (kind === "image") {
      let width: number | null = null;
      let height: number | null = null;
      let optimized: Buffer;
      let thumb: Buffer;
      try {
        const meta = await sharp(buffer, { failOn: "error" }).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;

        // §20 optimization: ≤1920px, no upscale, WebP q82
        optimized = await sharp(buffer)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        // §20/§21 thumbnail: 480px webp for galleries + editor pickers
        thumb = await sharp(buffer)
          .resize({ width: 480, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
      } catch (err) {
        console.error("[media] sharp failed:", err);
        return { ok: false, error: "Image could not be decoded (corrupt or unsupported)", status: 415 };
      }

      const id = randomUUID();
      const mainName = `${id}.webp`;
      const thumbName = `${id}-thumb.webp`;

      let url = "";
      let thumbUrl = "";
      let storageTarget: "local" | "cloudinary" = "local";

      if (cloudName()) {
        try {
          const cloudinary = cloudinaryClient();
          const main = await cloudinary.uploader.upload(
            `data:image/webp;base64,${optimized.toString("base64")}`,
            { resource_type: "image", folder: "okomba/media", public_id: id }
          );
          const thumbUp = await cloudinary.uploader.upload(
            `data:image/webp;base64,${thumb.toString("base64")}`,
            { resource_type: "image", folder: "okomba/media", public_id: `${id}-thumb` }
          );
          url = main.secure_url;
          thumbUrl = thumbUp.secure_url;
          storageTarget = "cloudinary";
        } catch (err) {
          console.error("[media] cloudinary upload failed — falling back to local:", err);
        }
      }

      if (storageTarget === "local") {
        await storeLocal(mainName, optimized);
        await storeLocal(thumbName, thumb);
      }

      const row = await db.mediaAsset.create({
        data: {
          kind: "image",
          originalName,
          storedName: mainName,
          url: "", // replaced with the public URL right after insert
          thumbUrl: null,
          bytes: optimized.byteLength,
          mime: "image/webp",
          width,
          height,
        },
      });

      const finalUrl = storageTarget === "local" ? `/api/media/${row.id}` : url;
      const finalThumb = storageTarget === "local" ? `/api/media/${row.id}?variant=thumb` : thumbUrl;
      await db.mediaAsset.update({
        where: { id: row.id },
        data: { url: finalUrl, thumbUrl: finalThumb },
      });

      return {
        ok: true,
        asset: {
          id: row.id,
          kind: "image",
          url: finalUrl,
          thumbUrl: finalThumb,
          originalName,
          bytes: optimized.byteLength,
          mime: "image/webp",
          width,
          height,
          storage: storageTarget,
        },
      };
    }

    /* ── Video / documents: pass-through local storage ── */
    const id = randomUUID();
    const ext = EXT_BY_MIME[mime] ?? "bin";
    const storedName = `${id}.${ext}`;
    await storeLocal(storedName, buffer);

    const row = await db.mediaAsset.create({
      data: {
        kind,
        originalName,
        storedName,
        url: "",
        bytes: buffer.byteLength,
        mime,
      },
    });
    const finalUrl = `/api/media/${row.id}`;
    await db.mediaAsset.update({ where: { id: row.id }, data: { url: finalUrl } });

    return {
      ok: true,
      asset: {
        id: row.id,
        kind,
        url: finalUrl,
        thumbUrl: null,
        originalName,
        bytes: buffer.byteLength,
        mime,
        width: null,
        height: null,
        storage: "local" as const,
      },
    };
  } catch (err) {
    console.error("[media] storage failed:", err);
    return { ok: false, error: "Media storage failed — please retry", status: 500 };
  }
}
