import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { getAiKnowledgeDto, updateAiKnowledge, AI_KNOWLEDGE_UPDATE_SCHEMA } from "@/lib/ai-knowledge";
import { aiAudit } from "@/lib/ai-chat-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/ai/knowledge — §50/§51 admin-configurable AI knowledge.  */
/*                                                                     */
/* GET  → typed projection (contact, faq, policies, services &         */
/*        pricing, education, businessProfile). Self-seeds the         */
/*        singleton with site defaults on first read.                  */
/* PUT  → AI_KNOWLEDGE_UPDATE_SCHEMA-validated partial update;         */
/*        audited as ai.knowledge.updated (§63). access_ai-gated.      */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const knowledge = await getAiKnowledgeDto();
    return NextResponse.json({ ok: true, knowledge });
  } catch (err) {
    console.error("[GET /api/admin/ai/knowledge]", err);
    return NextResponse.json({ ok: false, error: "Could not load AI knowledge" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const guard = await authorizeAdmin(req, "access_ai");
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

    const parsed = AI_KNOWLEDGE_UPDATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid knowledge update" },
        { status: 422 }
      );
    }

    await updateAiKnowledge(parsed.data);

    await aiAudit("ai.knowledge.updated", {
      actor: guard.auth.email,
      targetId: "singleton",
      meta: {
        sections: Object.keys(parsed.data),
        services: parsed.data.services?.length ?? 0,
        faq: parsed.data.faq?.length ?? 0,
        education: parsed.data.education?.length ?? 0,
      },
    });

    const knowledge = await getAiKnowledgeDto();
    return NextResponse.json({ ok: true, knowledge });
  } catch (err) {
    console.error("[PUT /api/admin/ai/knowledge]", err);
    return NextResponse.json({ ok: false, error: "Could not save AI knowledge" }, { status: 500 });
  }
}
