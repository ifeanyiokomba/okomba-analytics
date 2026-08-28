import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/customers/[id]                                       */
/*   Returns the canonical customer row + the FULL timeline of every   */
/*   interaction with them across the system:                          */
/*     - Inquiries (their submitted project requests)                  */
/*     - Invoices sent (with payment status + DVA + amounts)            */
/*     - EmailLog (every branded email sent to this address)           */
/*     - WhatsAppMessage (both directions, by phone)                   */
/*     - CustomerNote (admin's internal note trail)                    */
/*     - CustomerMessage (admin's outbound CRM messages)              */
/*   Everything is normalized into a single chronological timeline     */
/*   array so the detail dialog can render one thread.                 */
/* ------------------------------------------------------------------ */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const c = await db.customer.findUnique({ where: { id } });
    if (!c) {
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    // Pull every interaction stream keyed to this customer
    const [inquiries, invoices, emailLogs, waMessages, notes, myMessages] = await Promise.all([
      db.inquiry.findMany({
        where: { email: c.email },
        orderBy: { createdAt: "desc" },
      }),
      db.invoice.findMany({
        where: { customerEmail: c.email },
        orderBy: { createdAt: "desc" },
      }),
      db.emailLog.findMany({
        where: { recipientEmail: c.email },
        orderBy: { sentAt: "desc" },
        take: 50,
      }),
      (c.whatsapp || c.phone)
        ? db.whatsAppMessage.findMany({
            where: {
              OR: [
                ...(c.whatsapp ? [{ toPhone: c.whatsapp }, { fromPhone: c.whatsapp }] : []),
                ...(c.phone ? [{ toPhone: c.phone }, { fromPhone: c.phone }] : []),
              ],
            },
            orderBy: { sentAt: "desc" },
            take: 50,
          })
        : Promise.resolve([]),
      db.customerNote.findMany({
        where: { customerId: c.id },
        orderBy: { createdAt: "desc" },
      }),
      db.customerMessage.findMany({
        where: { customerId: c.id },
        orderBy: { sentAt: "desc" },
        take: 50,
      }),
    ]);

    // Compute simple CRM funnel stats
    const paidInvoices = invoices.filter((i) => i.status === "paid");
    const totalPipelineNaira = invoices.reduce((s, i) => s + Math.round(i.amountKobo / 100), 0);
    const totalPaidNaira = paidInvoices.reduce((s, i) => s + Math.round(i.amountKobo / 100), 0);
    const totalOutstandingNaira = invoices
      .filter((i) => ["sent", "pending", "overdue"].includes(i.status))
      .reduce((s, i) => s + Math.round(i.amountKobo / 100), 0);

    // Normalize everything into a single chronological timeline
    type TimelineItem = {
      id: string;
      kind: "inquiry" | "invoice" | "email" | "whatsapp" | "note" | "message";
      direction?: "inbound" | "outbound";
      title: string;
      subtitle?: string;
      body?: string;
      meta?: Record<string, unknown>;
      at: string; // ISO timestamp
    };

    const timeline: TimelineItem[] = [
      ...inquiries.map<TimelineItem>((i) => ({
        id: i.id,
        kind: "inquiry",
        direction: "inbound",
        title: `${i.service} inquiry`,
        subtitle: i.addlService ? `+ ${i.addlService}` : undefined,
        body: i.message,
        meta: {
          status: i.status,
          source: i.source,
          budget: i.budget ?? null,
          phone: i.phone ?? null,
          whatsapp: i.whatsapp ?? null,
        },
        at: i.createdAt.toISOString(),
      })),
      ...invoices.map<TimelineItem>((i) => ({
        id: i.id,
        kind: "invoice",
        direction: "outbound",
        title: `${i.invoiceNumber} · ${i.service}`,
        subtitle: i.durationLabel ?? undefined,
        body: i.description ?? undefined,
        meta: {
          amountNaira: Math.round(i.amountKobo / 100),
          status: i.status,
          dvaAccount: i.dvaAccountNumber ?? null,
          sentAt: i.sentAt?.toISOString() ?? null,
          paidAt: i.paidAt?.toISOString() ?? null,
        },
        at: i.createdAt.toISOString(),
      })),
      ...emailLogs.map<TimelineItem>((e) => ({
        id: e.id,
        kind: "email",
        direction: "outbound",
        title: e.subject,
        subtitle: e.type,
        body: e.bodyText ?? undefined,
        meta: {
          status: e.status,
          attachments: Array.isArray(e.attachments) ? e.attachments : [],
          invoiceId: e.invoiceId ?? null,
        },
        at: e.sentAt.toISOString(),
      })),
      ...waMessages.map<TimelineItem>((m) => ({
        id: m.id,
        kind: "whatsapp" as const,
        direction: (m.direction === "inbound" ? "inbound" : "outbound") as "inbound" | "outbound",
        title: m.direction === "inbound" ? "WhatsApp reply" : "WhatsApp sent",
        body: m.messageText ?? undefined,
        meta: {
          media: m.mediaUrl ?? null,
          status: m.status,
          relatedInvoice: m.relatedInvoiceId ?? null,
        },
        at: m.sentAt.toISOString(),
      })),
      ...notes.map<TimelineItem>((n) => ({
        id: n.id,
        kind: "note",
        title: `Note · ${n.context ?? "misc"}`,
        subtitle: `by ${n.author}`,
        body: n.body,
        at: n.createdAt.toISOString(),
      })),
      ...myMessages.map<TimelineItem>((m) => ({
        id: m.id,
        kind: "message",
        direction: "outbound",
        title: m.channel === "email" ? `Email · ${m.subject ?? "(no subject)"}` : "WhatsApp message",
        body: m.body,
        meta: { status: m.status, error: m.error },
        at: m.sentAt.toISOString(),
      })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));

    return NextResponse.json({
      ok: true,
      customer: {
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
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        lastContactAt: c.lastContactAt?.toISOString() ?? null,
      },
      timeline,
      stats: {
        inquiries: inquiries.length,
        invoices: invoices.length,
        paidInvoices: paidInvoices.length,
        emails: emailLogs.length,
        whatsapp: waMessages.length,
        notes: notes.length,
        myMessages: myMessages.length,
        totalPipelineNaira,
        totalPaidNaira,
        totalOutstandingNaira,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/customers/[id]]", err);
    return NextResponse.json({ ok: false, error: "Failed to load customer" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/admin/customers/[id]                                     */
/*   Update the canonical customer fields: status, tags, notes,        */
/*   company, role, phone, whatsapp, leadScore.                       */
/* ------------------------------------------------------------------ */

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      phone?: string;
      whatsapp?: string;
      company?: string;
      role?: string;
      status?: string;
      tags?: string[];
      notes?: string;
      leadScore?: number | null;
    };

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    const updated = await db.customer.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() || null } : {}),
        ...(body.whatsapp !== undefined ? { whatsapp: body.whatsapp.trim() || null } : {}),
        ...(body.company !== undefined ? { company: body.company.trim() || null } : {}),
        ...(body.role !== undefined ? { role: body.role.trim() || null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.tags !== undefined ? { tags: body.tags.filter(Boolean) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.leadScore !== undefined ? { leadScore: body.leadScore } : {}),
      },
    });

    return NextResponse.json({ ok: true, customer: { id: updated.id } });
  } catch (err) {
    console.error("[PATCH /api/admin/customers/[id]]", err);
    return NextResponse.json({ ok: false, error: "Failed to update customer" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* DELETE /api/admin/customers/[id]                                     */
/*   Soft delete — we don't actually wipe the row because the          */
/*   historical Inquiries/Invoices reference the email string.         */
/*   Instead, we set status=blocked and clear the personal contact      */
/*   fields (phone, whatsapp) per privacy best practice.                */
/* ------------------------------------------------------------------ */

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }
    await db.customer.update({
      where: { id },
      data: {
        status: "blocked",
        phone: null,
        whatsapp: null,
        notes: null,
        tags: "[]",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/customers/[id]]", err);
    return NextResponse.json({ ok: false, error: "Failed to remove customer" }, { status: 500 });
  }
}
