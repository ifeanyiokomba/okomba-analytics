import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET  /api/admin/customers                                            */
/*   List + search + filter the CRM customer book. Returns each        */
/*   customer with a small denormalized interaction summary so the     */
/*   list view doesn't need to fire one extra query per row.           */
/*                                                                      */
/*   Query params:                                                      */
/*     ?q=       full-text search across name/email/company/phone      */
/*     ?status=  lead | qualified | proposal_sent | paying | churned   */
/*     ?source=  manual | csv | excel | inquiry | ai_chat | invoice    */
/*     ?tag=     any tag string (matched against the JSON tags array)   */
/*     ?limit=   default 50, max 200                                    */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "all";
    const source = url.searchParams.get("source") ?? "all";
    const tag = url.searchParams.get("tag");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

    // Fetch the canonical customers. We do the cross-table interaction
    // counts separately so we don't ship huge join payloads to the client.
    const customers = await db.customer.findMany({
      where: {
        ...(status !== "all" ? { status } : {}),
        ...(source !== "all" ? { source } : {}),
        ...(tag ? { tags: { array_contains: tag } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { company: { contains: q } },
                { phone: { contains: q } },
                { whatsapp: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastContactAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    // For each customer, fetch the interaction counts in one round trip
    // per table — but Prisma has no native "group by email" so we just
    // query each table once and join in-memory.
    const emails = customers.map((c) => c.email);
    const contactKeys = customers
      .map((c) => c.whatsapp ?? c.phone ?? "")
      .filter(Boolean);
    const [inquiries, invoices, emailLogs, waMessages, notes] = await Promise.all([
      db.inquiry.groupBy({
        by: ["email"],
        where: { email: { in: emails } },
        _count: { _all: true },
      }),
      db.invoice.groupBy({
        by: ["customerEmail"],
        where: { customerEmail: { in: emails } },
        _count: { _all: true },
      }),
      db.emailLog.groupBy({
        by: ["recipientEmail"],
        where: { recipientEmail: { in: emails } },
        _count: { _all: true },
      }),
      db.whatsAppMessage.groupBy({
        by: ["toPhone"],
        where: { toPhone: { in: contactKeys } },
        _count: { _all: true },
      }),
      db.customerNote.groupBy({
        by: ["customerId"],
        where: { customerId: { in: customers.map((c) => c.id) } },
        _count: { _all: true },
      }),
    ]);

    const inquiryCount = new Map(inquiries.map((g) => [g.email, g._count._all]));
    const invoiceCount = new Map(invoices.map((g) => [g.customerEmail, g._count._all]));
    const emailCount = new Map(emailLogs.map((g) => [g.recipientEmail, g._count._all]));
    const waCount = new Map(waMessages.map((g) => [g.toPhone, g._count._all]));
    const noteCount = new Map(notes.map((g) => [g.customerId, g._count._all]));

    // Also include total CRM stats for the header summary card
    const totalCustomers = await db.customer.count();
    const totalByStatus = await db.customer.groupBy({ by: ["status"], _count: { _all: true } });
    const statusBreakdown: Record<string, number> = {};
    for (const g of totalByStatus) statusBreakdown[g.status] = g._count._all;

    const rows = customers.map((c) => {
      const contactKey = c.whatsapp ?? c.phone ?? "";
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        company: c.company,
        role: c.role,
        status: c.status,
        source: c.source,
        leadScore: c.leadScore,
        tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
        notes: c.notes,
        lastContactAt: c.lastContactAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        stats: {
          inquiries: inquiryCount.get(c.email) ?? 0,
          invoices: invoiceCount.get(c.email) ?? 0,
          emails: emailCount.get(c.email) ?? 0,
          whatsapp: contactKey ? waCount.get(contactKey) ?? 0 : 0,
          notes: noteCount.get(c.id) ?? 0,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      customers: rows,
      total: totalCustomers,
      statusBreakdown,
    });
  } catch (err) {
    console.error("[GET /api/admin/customers]", err);
    return NextResponse.json({ ok: false, error: "Failed to load customers" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/admin/customers                                           */
/*   Create a single customer manually. If the email already exists,   */
/*   upsert instead so the admin can edit the existing row.             */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json()) as {
      name: string;
      email: string;
      phone?: string;
      whatsapp?: string;
      company?: string;
      role?: string;
      status?: string;
      tags?: string[];
      notes?: string;
      source?: string;
      leadScore?: number;
    };

    if (!body.email || !body.name) {
      return NextResponse.json({ ok: false, error: "Name and email are required" }, { status: 400 });
    }

    const tagList = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];

    const c = await db.customer.upsert({
      where: { email: body.email.toLowerCase().trim() },
      create: {
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        phone: body.phone?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        company: body.company?.trim() || null,
        role: body.role?.trim() || null,
        status: body.status ?? "lead",
        tags: tagList,
        notes: body.notes ?? null,
        source: body.source ?? "manual",
        leadScore: body.leadScore ?? null,
      },
      update: {
        name: body.name.trim(),
        phone: body.phone?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        company: body.company?.trim() || null,
        role: body.role?.trim() || null,
        status: body.status ?? undefined,
        tags: tagList.length ? tagList : undefined,
        notes: body.notes ?? undefined,
        leadScore: body.leadScore ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, customer: { id: c.id, email: c.email } });
  } catch (err) {
    console.error("[POST /api/admin/customers]", err);
    return NextResponse.json({ ok: false, error: "Failed to save customer" }, { status: 500 });
  }
}
