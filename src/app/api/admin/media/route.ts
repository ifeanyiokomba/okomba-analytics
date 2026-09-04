import { NextResponse } from "next/server";
import { authorizeAdmin, authorizeAdminAny } from "@/lib/admin-auth";
import { saveMediaUpload } from "@/lib/media";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/media — upload one media asset (§20/§21/§25/§93).  */
/* multipart/form-data with a single `file` field.                    */
/* Validation + optimization happen in src/lib/media.ts.              */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const guard = await authorizeAdminAny(req, ["manage_posts", "manage_ads"]);
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { ok: false, error: "Expected multipart/form-data" },
        { status: 400 }
      );
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
    return NextResponse.json({ ok: true, asset: result.asset }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/media]", err);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
