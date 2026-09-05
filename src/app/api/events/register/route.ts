import { NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/comments";
import { eventRegistrationSchema, registerForEvent } from "@/lib/events";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/events/register — §34 public registration.               */
/*                                                                     */
/* IP rate-limited (same helper + budget as public comments) before   */
/* the body is even parsed. Email failure never blocks a successful   */
/* registration (fire-and-forget inside registerForEvent).            */
/*                                                                     */
/* 201 { ok, duplicate } · 404 event not found · 409 closed/full ·    */
/* 422 validation (zod message) · 429 rate limited · 400 not open.    */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // 1) Rate limit — before parsing the body (§92-style budget)
    if (isRateLimited(`event-register:${ip}`)) {
      return NextResponse.json(
        { ok: false, error: "Too many registration attempts — please try again later." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    // 2) Validate the §34 contract (consent is a hard literal)
    const parsed = eventRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid registration" },
        { status: 422 }
      );
    }
    const data = parsed.data;

    // 3) Register (capacity / open-window / duplicate logic inside)
    const result = await registerForEvent(data.eventId, data, { ip });
    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
      }
      if (result.reason === "full") {
        return NextResponse.json(
          { ok: false, error: "This event is fully booked." },
          { status: 409 }
        );
      }
      if (result.reason === "past") {
        return NextResponse.json(
          { ok: false, error: "This event has already started." },
          { status: 400 }
        );
      }
      // closed: not public or not scheduled
      return NextResponse.json(
        { ok: false, error: "This event is not open for registration." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, duplicate: result.duplicate, registrationId: result.registration.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/events/register]", err);
    return NextResponse.json({ ok: false, error: "Failed to register" }, { status: 500 });
  }
}
