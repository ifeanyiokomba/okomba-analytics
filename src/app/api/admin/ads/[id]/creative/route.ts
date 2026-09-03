import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { saveMediaUpload } from "@/lib/media";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/ads/[id]/creative — §41 creative upload.           */
/* multipart/form-data `file`. Runs the shared media pipeline         */
/* (MIME allowlist → size cap → magic bytes → sharp optimize) and    */
/* attaches the asset as the campaign creative.                      */
/* ------------------------------------------------------------------ */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const { id } = await ctx.params;

    const existing = await db.adRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Ad request not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file field" }, { status: 400 });
    }

    const result = await saveMediaUpload(file);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    const updated = await db.adRequest.update({
      where: { id },
      data: {
        creativeId: result.asset.id,
        creativeUrl: null, // uploaded creative wins over external URL
      },
    });

    return NextResponse.json(
      { ok: true, creative: result.asset, adId: updated.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/ads/:id/creative]", err);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
