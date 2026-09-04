import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { ensurePortalToken, generatePortalToken, portalUrlFor } from "@/lib/portal";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/invoices/[id]/portal-token (Module 8A)               */
/* Ensure (or ?regenerate=1 rotate) the client-portal token for an      */
/* invoice. Also backfills tokens on invoices created before Module 8.  */
/* ------------------------------------------------------------------ */

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await authorizeAdmin(req, "create_invoices");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const { id } = await params;
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const rotate = url.searchParams.get("regenerate") === "1";

    let token: string | null;
    if (rotate) {
      token = generatePortalToken();
      await db.invoice.update({ where: { id }, data: { secureToken: token } });
    } else {
      token = await ensurePortalToken(id);
    }

    if (!token) {
      return NextResponse.json({ ok: false, error: "Could not create token" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      token,
      portalUrl: portalUrlFor(token),
      appPath: `/portal/${token}`,
    });
  } catch (err) {
    console.error("[POST /api/admin/invoices/[id]/portal-token]", err);
    return NextResponse.json({ ok: false, error: "Failed to create portal token" }, { status: 500 });
  }
}
