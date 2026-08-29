/**
 * Customer service — local find-or-create by normalized email
 * (BATCH 2 — directive §14, §28, §48).
 *
 * The Customer record is the canonical contact. When an enquiry comes in
 * through `/api/inquiries`, we upsert the Customer BEFORE creating the
 * Paystack customer (BATCH 3) or provisioning a DVA (BATCH 4). The flow
 * per directive §28 is:
 *
 *   Validate → Create Inquiry → Find Customer by normalized email
 *            → Create/Update Customer → Link Inquiry → Customer
 *
 * Legacy `name` field is preserved for display/compat. New submissions
 * store firstName + lastName explicitly (directive §48: "Do not use
 * name splitting for newly submitted users"). For legacy rows that only
 * have `name`, we keep it as-is — no destructive migration.
 *
 * This module is Paystack-agnostic. BATCH 3 layers Paystack customer
 * resolution on top via `getOrCreatePaystackCustomer()`.
 */

import { db } from "@/lib/db";
import {
  normalizeEmail,
  normalizePhone,
} from "@/lib/countries";

export type CustomerIdentityInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  countryCode?: string | null;
  company?: string | null;
  role?: string | null;
  source?: string; // manual | inquiry | ai_chat | invoice | broadcast | csv | excel
};

export type CustomerUpsertResult = {
  customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    countryCode: string | null;
    name: string; // display/legacy
  };
  created: boolean; // true if a new Customer row was created
};

/**
 * Find or create a Customer row by normalized email.
 * Updates existing rows with any newly-supplied identity fields
 * (firstName/lastName/countryCode/phone/whatsapp) when they were
 * previously NULL — never overwrites non-null values (idempotent).
 */
export async function findOrCreateCustomer(
  input: CustomerIdentityInput
): Promise<CustomerUpsertResult> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("findOrCreateCustomer: email is required");
  }
  const firstName = input.firstName?.trim() || null;
  const lastName = input.lastName?.trim() || null;
  const countryCode = input.countryCode?.trim().toUpperCase() || null;
  const phone = normalizePhone(input.phone) ?? null;
  const whatsapp = normalizePhone(input.whatsapp) ?? null;
  const company = input.company?.trim() || null;
  const role = input.role?.trim() || null;
  const source = input.source ?? "inquiry";

  const existing = await db.customer.findUnique({ where: { email } });

  if (existing) {
    // Idempotent update: only fill NULL fields, never overwrite real data.
    const patch: Record<string, string | Date | null> = {};
    if (firstName && !existing.firstName) patch.firstName = firstName;
    if (lastName && !existing.lastName) patch.lastName = lastName;
    if (countryCode && !existing.countryCode) patch.countryCode = countryCode;
    if (phone && !existing.phone) patch.phone = phone;
    if (whatsapp && !existing.whatsapp) patch.whatsapp = whatsapp;
    if (company && !existing.company) patch.company = company;
    if (role && !existing.role) patch.role = role;

    // Always bump lastContactAt to "now" so the CRM list view sees the
    // freshest inquiry at the top.
    patch.lastContactAt = new Date();

    const updated = await db.customer.update({
      where: { id: existing.id },
      data: patch,
    });
    return {
      customer: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        countryCode: updated.countryCode,
        name: updated.name,
      },
      created: false,
    };
  }

  // Compute legacy `name` display field from firstName + lastName.
  // Directive §48: "Do not use name splitting for newly submitted users."
  // We're not splitting — we're COMBINING two explicit fields into one
  // display string for backward compat with the existing UI/PDF pipeline.
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0] ||
    "Customer";

  const created = await db.customer.create({
    data: {
      name: displayName,
      firstName,
      lastName,
      countryCode,
      email,
      phone,
      whatsapp,
      company,
      role,
      source,
      status: "lead",
      tags: "[]",
      lastContactAt: new Date(),
    },
  });

  return {
    customer: {
      id: created.id,
      email: created.email,
      firstName: created.firstName,
      lastName: created.lastName,
      countryCode: created.countryCode,
      name: created.name,
    },
    created: true,
  };
}

/** Convenience: link an Inquiry to its Customer row by ID. */
export async function linkInquiryToCustomer(
  inquiryId: string,
  customerId: string
): Promise<void> {
  try {
    await db.inquiry.update({
      where: { id: inquiryId },
      data: { customerId },
    });
  } catch (err) {
    // Non-fatal — the inquiry was still created; the link is a convenience
    // for the admin CRM view, not a money-path invariant.
    console.error("[customer-service] linkInquiryToCustomer failed:", err);
  }
}
