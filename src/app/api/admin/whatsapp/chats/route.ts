import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { normalizePhone } from "@/lib/whatsapp";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/whatsapp/chats                                       */
/* Left panel of the Module-6 widget: unified customer list built      */
/* from invoices + enquiries + actual WhatsApp traffic, with the      */
/* last message preview, unread count and the latest unpaid invoice   */
/* (powers the "Attach Invoice" action).                               */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const [invoices, inquiries, messages] = await Promise.all([
      db.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
      db.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        select: { id: true, name: true, phone: true, whatsapp: true, service: true, createdAt: true },
      }),
      db.whatsAppMessage.findMany({
        orderBy: { sentAt: "desc" },
        take: 500,
      }),
    ]);

    type Chat = {
      phone: string;
      name: string;
      service: string | null;
      lastMessage: { text: string | null; direction: string; sentAt: string; media: string | null } | null;
      lastActivityAt: string;
      unread: number;
      totalMessages: number;
      latestInvoice:
        | {
            id: string;
            invoiceNumber: string;
            amountNaira: number;
            dueDate: string | null;
            status: string;
          }
        | null;
    };

    const chats = new Map<string, Chat>();

    const ensure = (phone: string, name: string, service: string | null): Chat => {
      let c = chats.get(phone);
      if (!c) {
        c = {
          phone,
          name,
          service,
          lastMessage: null,
          lastActivityAt: new Date(0).toISOString(),
          unread: 0,
          totalMessages: 0,
          latestInvoice: null,
        };
        chats.set(phone, c);
      }
      // Prefer a real name over an anonymous phone label
      if (name && (c.name === phone || !c.name)) c.name = name;
      return c;
    };

    // 1. Invoices → customers with a commercial relationship
    for (const inv of invoices) {
      const phone = normalizePhone(inv.customerPhone);
      if (!phone) continue;
      const c = ensure(phone, inv.customerName, inv.service);
      if (!c.latestInvoice && ["sent", "pending", "overdue"].includes(inv.status)) {
        c.latestInvoice = {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amountNaira: Math.round(inv.amountKobo / 100),
          dueDate: inv.dueDate?.toISOString() ?? null,
          status: inv.status,
        };
      }
    }

    // 2. Enquiries → prospective customers
    for (const inq of inquiries) {
      const phone = normalizePhone(inq.whatsapp ?? inq.phone);
      if (!phone) continue;
      ensure(phone, inq.name, inq.service);
    }

    // 3. WhatsApp traffic → last message, unread, anonymous chats
    const byPhoneAsc = new Map<string, typeof messages>();
    for (const m of messages.slice().reverse()) {
      const phone = m.direction === "outbound" ? m.toPhone : m.fromPhone;
      const key = normalizePhone(phone);
      if (!key) continue;
      const list = byPhoneAsc.get(key) ?? [];
      list.push(m);
      byPhoneAsc.set(key, list);
    }

    for (const [key, list] of byPhoneAsc) {
      const c = ensure(key, key, null);
      c.totalMessages = list.length;
      const last = list[list.length - 1];
      c.lastMessage = {
        text: last.messageText,
        direction: last.direction,
        sentAt: last.sentAt.toISOString(),
        media: last.mediaFilename,
      };
      c.lastActivityAt = last.sentAt.toISOString();
      // unread = inbound messages newer than the newest outbound one
      const lastOutboundAt = list
        .filter((m) => m.direction === "outbound")
        .reduce((max, m) => (m.sentAt > max ? m.sentAt : max), new Date(0));
      c.unread = list.filter(
        (m) => m.direction === "inbound" && m.sentAt > lastOutboundAt
      ).length;
    }

    const result = Array.from(chats.values())
      .sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1))
      .slice(0, 120);

    return NextResponse.json({ ok: true, chats: result });
  } catch (err) {
    console.error("[GET /api/admin/whatsapp/chats]", err);
    return NextResponse.json({ ok: false, error: "Failed to load chats" }, { status: 500 });
  }
}
