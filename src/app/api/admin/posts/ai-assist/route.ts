import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { generatePostAssistance } from "@/lib/post-ai";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/posts/ai-assist (directive §27)                     */
/* AI editorial assistance for the post editor — headline/structure/  */
/* clarity/grammar/SEO/excerpt/social caption/subscriber announcement */
/* /CTA. Grounded strictly to the supplied draft (no invented claims). */
/* ------------------------------------------------------------------ */
const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(180),
  excerpt: z.string().trim().max(400).optional().default(""),
  content: z.string().trim().min(40, "Write at least 40 characters before asking for help"),
  category: z.string().trim().max(60).optional().default(""),
  tags: z.array(z.string().trim().max(40)).max(10).optional().default([]),
});

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid input" }, { status: 400 });
    }

    const assistance = await generatePostAssistance(parsed.data);
    return NextResponse.json({ ok: true, assistance });
  } catch (err) {
    console.error("[POST /api/admin/posts/ai-assist]", err);
    return NextResponse.json({ ok: false, error: "AI assistance failed — try again" }, { status: 500 });
  }
}
