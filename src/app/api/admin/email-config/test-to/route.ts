import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  getTestRecipient,
  saveTestRecipient,
} from "@/lib/email-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET  /api/admin/email-config/test-to                                */
/*   Returns the configured test recipient email. Used by the admin    */
/*   Settings tab to pre-fill the field on load.                       */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const to = await getTestRecipient();
    return NextResponse.json({ ok: true, to });
  } catch (err) {
    console.error("[GET /api/admin/email-config/test-to]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load test recipient" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/admin/email-config/test-to                                */
/*   Persists a new test recipient. Stored as an EmailProviderConfig    */
/*   row with provider="test_recipient" (a pseudo-row, never part of    */
/*   the failover chain — `email-failover.ts` filters it out).          */
/*                                                                    */
/*   Body: { to: "email@example.com" }                                */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json()) as { to?: string };
    const to = body?.to?.trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { ok: false, error: "A valid email address is required" },
        { status: 400 }
      );
    }
    await saveTestRecipient(to);
    return NextResponse.json({ ok: true, to });
  } catch (err) {
    console.error("[POST /api/admin/email-config/test-to]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save test recipient" },
      { status: 500 }
    );
  }
}
