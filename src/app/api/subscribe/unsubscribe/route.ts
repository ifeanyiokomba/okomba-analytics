import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/subscribe/unsubscribe?token=… — one-click unsubscribe.
 * Marks the subscriber as unsubscribed (record retained for audit/compliance)
 * and shows a branded confirmation page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return unsubPage(false, "The unsubscribe link is invalid.");
  }

  try {
    const subscriber = await db.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return unsubPage(false, "We couldn't find that unsubscribe link — it may be invalid or already used.");
    }

    if (subscriber.status === "unsubscribed") {
      return unsubPage(true, "You're already unsubscribed — you won't receive any more emails.", subscriber.email);
    }

    await db.subscriber.update({
      where: { id: subscriber.id },
      data: { status: "unsubscribed", confirmToken: null },
    });

    return unsubPage(true, "You've been unsubscribed. You won't receive any more insights emails — sorry to see you go.", subscriber.email);
  } catch (err) {
    console.error("[subscribe/unsubscribe] error:", err);
    return unsubPage(false, "Something went wrong processing your unsubscribe. Please try again.");
  }
}

/* ── Branded unsubscribe page (HTML response) ─────────────── */
function unsubPage(success: boolean, message: string, email?: string): NextResponse {
  const accent = success ? "#00C9A7" : "#EF4444";
  const title = success ? "Unsubscribed" : "Unsubscribe failed";

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${title} — Okomba Analytics</title>
  <link rel="icon" href="/favicon.svg" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #05070d;
      color: #f4f6fa;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), #0b101c;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 40px 32px;
      text-align: center;
    }
    .badge {
      width: 56px; height: 56px;
      border-radius: 16px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${success ? "rgba(0,201,167,0.12)" : "rgba(239,68,68,0.12)"};
      border: 1px solid ${accent}44;
    }
    .badge svg { width: 26px; height: 26px; }
    h1 { font-size: 22px; letter-spacing: -0.02em; margin-bottom: 12px; }
    p { font-size: 14px; line-height: 1.65; color: #9aa3b8; }
    .email { color: #f0a500; font-weight: 600; }
    a.button {
      display: inline-block;
      margin-top: 28px;
      padding: 13px 32px;
      border-radius: 14px;
      background: linear-gradient(90deg, #f7c24a, #f0a500);
      color: #0b0f1a;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 4px 22px rgba(240,165,0,0.28);
    }
    a.button:hover { transform: translateY(-1px); }
    .resub {
      margin-top: 16px;
      font-size: 12.5px;
      color: #6b7280;
    }
    .brand {
      margin-top: 30px;
      font-family: Georgia, serif;
      font-weight: 700;
      font-size: 17px;
    }
    .brand span { color: #f0a500; font-family: 'Segoe UI', sans-serif; font-size: 10px; letter-spacing: 0.2em; display: block; margin-top: 3px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      ${success
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="#00C9A7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`}
    </div>
    <h1>${title}</h1>
    <p>${message}${email ? `<br/><br/><span class="email">${email}</span>` : ""}</p>
    ${success ? `<p class="resub">Changed your mind? You can re-subscribe anytime from the website.</p>` : ""}
    <a class="button" href="/#insights">Back to Okomba Analytics</a>
    <div class="brand">Okomba<span>ANALYTICS</span></div>
  </div>
</body>
</html>`,
    {
      status: success ? 200 : 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}
