/* ─────────────────────────────────────────────────────────────
   Media (client-safe subset) — types + pure helpers shared by
   client components and the server upload pipeline. Contains
   NO Node-only imports (sharp / cloudinary live in media.ts,
   which only server code imports).

   Directive §25 post attachments + §93 file security metadata.
   ───────────────────────────────────────────────────────────── */

export type MediaKind = "image" | "video" | "document";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_MIMES = new Set(["video/mp4", "video/webm"]);
const DOC_MIMES = new Set(["application/pdf"]);

export const MEDIA_CAPS: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024, // 10 MB pre-optimization
  video: 64 * 1024 * 1024, // 64 MB
  document: 25 * 1024 * 1024, // 25 MB
};

export function kindOfMime(mime: string): MediaKind | null {
  if (IMAGE_MIMES.has(mime)) return "image";
  if (VIDEO_MIMES.has(mime)) return "video";
  if (DOC_MIMES.has(mime)) return "document";
  return null;
}

/** §93 filename sanitization (display only — never a storage key). */
export function sanitizeFilename(name: string): string {
  const base = (name ?? "file").split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/_{2,}/g, "_")
    .trim();
  return (cleaned || "file").slice(0, 80);
}

export type AttachmentMeta = {
  name: string;
  url: string;
  bytes: number;
  mime: string;
  kind: MediaKind;
};

export function isAttachmentList(v: unknown): v is AttachmentMeta[] {
  if (!Array.isArray(v) || v.length > 20) return false;
  return v.every(
    (a) =>
      a !== null &&
      typeof a === "object" &&
      typeof (a as AttachmentMeta).name === "string" &&
      typeof (a as AttachmentMeta).url === "string" &&
      typeof (a as AttachmentMeta).bytes === "number" &&
      typeof (a as AttachmentMeta).mime === "string" &&
      typeof (a as AttachmentMeta).kind === "string" &&
      ["image", "video", "document"].includes((a as AttachmentMeta).kind)
  );
}

/** Accepts the loose JSON from the DB column and returns a typed list. */
export function parseAttachments(raw: unknown): AttachmentMeta[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (isAttachmentList(parsed)) return parsed;
  } catch {
    /* fallthrough */
  }
  return [];
}
