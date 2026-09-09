import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { aiAudit } from "@/lib/ai-chat-monitor";
import {
  getAutonomyConfigDto,
  updateAutonomyConfig,
  AUTONOMY_UPDATE_SCHEMA,
} from "@/lib/ai-autonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/ai/autonomy — §52 AI autonomy control center.            */
/*                                                                     */
/* GET → typed projection (enabled, per-action levels, budget,         */
/*       allowlists, escalation rules, never-do list). Self-seeds     */
/*       the SAFE defaults on first read (autonomy off).              */
/* PUT → AUTONOMY_UPDATE_SCHEMA-validated partial update (levels +    */
/*       escalationRules merge; arrays replace wholesale); audited    */
/*       as ai.autonomy.updated {sections}. manage_settings-gated.    */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "manage_settings");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const config = await getAutonomyConfigDto();
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.error("[GET /api/admin/ai/autonomy]", err);
    return NextResponse.json({ ok: false, error: "Could not load autonomy config" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const guard = await authorizeAdmin(req, "manage_settings");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = AUTONOMY_UPDATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid autonomy update" },
        { status: 422 }
      );
    }

    await updateAutonomyConfig(parsed.data);

    await aiAudit("ai.autonomy.updated", {
      actor: guard.auth.email,
      targetId: "singleton",
      meta: {
        sections: Object.keys(parsed.data),
        enabled: parsed.data.enabled,
        levels: parsed.data.levels ?? null,
        maxEmailsPerDay: parsed.data.maxEmailsPerDay ?? null,
      },
    });

    const config = await getAutonomyConfigDto();
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.error("[PUT /api/admin/ai/autonomy]", err);
    return NextResponse.json({ ok: false, error: "Could not save autonomy config" }, { status: 500 });
  }
}
