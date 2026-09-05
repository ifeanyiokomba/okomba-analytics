/**
 * Client portal helpers (Phase-2 Module 8A).
 *
 * Each invoice gets a 192-bit random URL token — the portal is
 * intentionally auth-free (spec: "No auth"); unguessability of the
 * token IS the access control.
 */

import { randomBytes } from "crypto";
import { db } from "@/lib/db";

/** Cryptographically random, URL-safe portal token (32 bytes → 43 chars). */
export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Public portal URL embedded in customer emails.
 * Spec format: https://app.okomba.com/portal/{token}
 * Override with PORTAL_BASE_URL (or NEXT_PUBLIC_SITE_URL) per environment.
 */
export function portalUrlFor(token: string): string {
  const base = (
    process.env.PORTAL_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://app.okomba.com"
  ).replace(/\/$/, "");
  return `${base}/portal/${token}`;
}

/**
 * Ensure an invoice has a secure token — generates + persists one
 * when missing. Safe to call repeatedly (idempotent).
 */
export async function ensurePortalToken(invoiceId: string): Promise<string | null> {
  try {
    const inv = await db.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, secureToken: true },
    });
    if (!inv) return null;
    if (inv.secureToken) return inv.secureToken;
    const token = generatePortalToken();
    try {
      const updated = await db.invoice.update({
        where: { id: invoiceId },
        data: { secureToken: token },
        select: { secureToken: true },
      });
      return updated.secureToken;
    } catch {
      // rare collision / concurrent generation — re-read
      const again = await db.invoice.findUnique({
        where: { id: invoiceId },
        select: { secureToken: true },
      });
      return again?.secureToken ?? null;
    }
  } catch (err) {
    console.error("[portal] ensurePortalToken failed:", err);
    return null;
  }
}
