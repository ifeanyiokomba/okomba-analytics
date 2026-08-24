import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyNewSubscriber } from "@/lib/notify";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Email is required")
    .email("Please enter a valid email address")
    .max(200, "Email is too long"),
});

// Simple in-memory rate limit: 5 subscribes / 10 min per IP
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function makeToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

/**
 * POST /api/subscribe — public newsletter subscription (double opt-in step 1).
 * Creates/reuses a pending subscriber and returns the confirmation path.
 * The client UI simulates the confirmation email (dev) while the notification
 * stub carries the confirm link for a real email provider.
 */
export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const existing = await db.subscriber.findUnique({ where: { email } });

    if (existing && existing.status === "confirmed") {
      // Already confirmed — idempotent success
      return NextResponse.json({ ok: true, alreadyConfirmed: true }, { status: 201 });
    }

    const token = existing?.confirmToken ?? makeToken();

    if (existing) {
      // pending — refresh the token so a re-subscribe gets a fresh link
      await db.subscriber.update({
        where: { email },
        data: { confirmToken: token },
      });
    } else {
      await db.subscriber.create({
        data: { email, status: "pending", confirmToken: token },
      });
    }

    // Fire-and-forget notification carrying the confirmation link
    notifyNewSubscriber(email).catch(() => undefined);

    // In dev (no email provider) the client shows the confirm link directly.
    return NextResponse.json(
      { ok: true, confirmPath: `/api/subscribe/confirm?token=${token}` },
      { status: 201 }
    );
  } catch (err) {
    console.error("[subscribe] error:", err);
    return NextResponse.json(
      { ok: false, error: "Subscription failed. Please try again." },
      { status: 500 }
    );
  }
}
