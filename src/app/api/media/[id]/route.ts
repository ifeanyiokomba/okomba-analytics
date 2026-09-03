import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readMediaFile } from "@/lib/media";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/media/[id] — stream a stored media asset (§25).           */
/* Cloudinary-hosted assets 302-redirect to their CDN URL. Local      */
/* assets are streamed with the recorded content-type + immutable     */
/* cache (storage keys are content-addressed cuids, safe to cache).   */
/* ?variant=thumb serves the 480px webp preview for images.           */
/* ------------------------------------------------------------------ */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^[A-Za-z0-9-]{6,64}$/.test(id)) {
      return NextResponse.json({ ok: false, error: "Invalid media id" }, { status: 400 });
    }

    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ ok: false, error: "Media not found" }, { status: 404 });
    }

    // Cloudinary-hosted → redirect to the CDN URL
    if (asset.url.startsWith("http")) {
      const variant = new URL(req.url).searchParams.get("variant");
      const target = variant === "thumb" && asset.thumbUrl?.startsWith("http")
        ? asset.thumbUrl
        : asset.url;
      return NextResponse.redirect(target, 302);
    }

    // Local file — derive the requested variant's storage name
    const variant = new URL(req.url).searchParams.get("variant");
    let storedName = asset.storedName;
    let mime = asset.mime;
    if (variant === "thumb" && asset.kind === "image" && asset.thumbUrl) {
      const thumbName = asset.storedName.replace(/\.webp$/, "-thumb.webp");
      try {
        await readMediaFile(thumbName); // existence probe
        storedName = thumbName;
      } catch {
        // no thumb stored — fall back to the main file
      }
    }

    const buffer = await readMediaFile(storedName);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": variant === "thumb" ? "inline" : "inline",
      },
    });
  } catch (err) {
    console.error("[GET /api/media/[id]]", err);
    return NextResponse.json({ ok: false, error: "Media not found" }, { status: 404 });
  }
}
