import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  DEFAULT_PROVIDER_DISPLAY_NAMES,
  ALL_PROVIDER_SLOTS,
  listPublicProviders,
  saveEmailProvider,
  type EmailProviderName,
} from "@/lib/email-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET  /api/admin/email-config                                        */
/*   Returns all configured email providers with credentials REDACTED.  */
/*   Only the field NAMES (e.g. "apiKey", "fromEmail") that have       */
/*   values are surfaced — the values themselves never leave the       */
/*   server. The admin Settings tab uses `hasCredentials` +           */
/*   `credentialFields` to render "● saved" markers on populated       */
/*   fields without ever showing the secret.                          */
/* ------------------------------------------------------------------ */

const VALID_PROVIDERS = new Set<string>(ALL_PROVIDER_SLOTS);

export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const providers = await listPublicProviders();
    // Always return all 4 slots, even if a row doesn't exist yet —
    // the admin Settings tab needs the full set to render the cards.
    const byProvider = new Map(providers.map((p) => [p.provider, p]));
    const all = ALL_PROVIDER_SLOTS.map((slot) => {
      const existing = byProvider.get(slot);
      if (existing) return existing;
      return {
        id: "",
        provider: slot,
        displayName: DEFAULT_PROVIDER_DISPLAY_NAMES[slot],
        priority: ALL_PROVIDER_SLOTS.indexOf(slot) + 1,
        enabled: false,
        hasCredentials: false,
        lastTestAt: null,
        lastTestStatus: null,
        lastTestError: null,
        credentialFields: [],
        updatedAt: new Date(0).toISOString(),
      };
    });
    return NextResponse.json({ ok: true, providers: all });
  } catch (err) {
    console.error("[GET /api/admin/email-config]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load email provider configs" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/admin/email-config                                        */
/*   Save one provider's credentials (AES-256-GCM encrypted) +        */
/*   priority + enabled flag.                                          */
/*                                                                    */
/*   Body: {                                                          */
/*     provider: "apps_script" | "resend" | "mailtrap" | "maileroo",  */
/*     credentials: { webhookUrl?, apiKey?, fromEmail?, ... } | null, */
/*     displayName?: string,                                           */
/*     priority?: number,                                              */
/*     enabled?: boolean                                              */
/*   }                                                                */
/*                                                                    */
/*   When `credentials` is null, the server keeps the existing         */
/*   encrypted blob (used by the Settings tab's enabled-toggle when    */
/*   no new credentials were entered).                                 */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json()) as {
      provider: string;
      credentials: Record<string, string> | null;
      displayName?: string;
      priority?: number;
      enabled?: boolean;
    };

    if (!body.provider || !VALID_PROVIDERS.has(body.provider)) {
      return NextResponse.json(
        { ok: false, error: "Invalid provider" },
        { status: 400 }
      );
    }
    const provider = body.provider as EmailProviderName;

    // If new credentials were provided, save them. Otherwise just
    // update the metadata (enabled / priority / displayName) on the
    // existing row — we need to fetch the existing row's
    // credentialsEnc so we don't blow it away.
    if (body.credentials && Object.keys(body.credentials).length > 0) {
      const saved = await saveEmailProvider(provider, body.credentials, {
        displayName: body.displayName,
        priority: body.priority,
        enabled: body.enabled,
      });
      return NextResponse.json({
        ok: true,
        provider: {
          id: saved.id,
          provider: saved.provider,
          displayName: saved.displayName,
          priority: saved.priority,
          enabled: saved.enabled,
        },
      });
    }

    // Metadata-only update — keep existing credentialsEnc.
    // We use Prisma directly here because saveEmailProvider always
    // re-encrypts (it has no "update without overwriting" path).
    const { db } = await import("@/lib/db");
    const existing = await db.emailProviderConfig.findUnique({
      where: { provider },
    });
    if (!existing) {
      // No row exists yet AND no credentials provided — nothing to do.
      return NextResponse.json(
        { ok: false, error: "No credentials provided and no existing row" },
        { status: 400 }
      );
    }
    const updated = await db.emailProviderConfig.update({
      where: { provider },
      data: {
        ...(body.displayName ? { displayName: body.displayName } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      },
    });
    return NextResponse.json({
      ok: true,
      provider: {
        id: updated.id,
        provider: updated.provider,
        displayName: updated.displayName,
        priority: updated.priority,
        enabled: updated.enabled,
      },
    });
  } catch (err) {
    console.error("[POST /api/admin/email-config]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save email provider config" },
      { status: 500 }
    );
  }
}
