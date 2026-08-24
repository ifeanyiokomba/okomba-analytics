/**
 * Client-side CSV export utilities for the admin dashboard.
 * Generates CSV from already-loaded data — no new API surface needed.
 */

/** Escape a CSV field per RFC 4180 (quote if needed, double embedded quotes). */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: (string | null | undefined)[][]): string {
  return rows.map((row) => row.map((cell) => escapeCsvField(cell ?? "")).join(",")).join("\r\n");
}

export type InquiryCsvRow = {
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  service: string;
  addlService: string | null;
  budget: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export function exportInquiriesCsv(inquiries: InquiryCsvRow[]): void {
  const header = [
    "Name",
    "Email",
    "Phone",
    "WhatsApp",
    "Service",
    "Additional Service",
    "Budget",
    "Message",
    "Status",
    "Received At",
  ];
  const rows = inquiries.map((i) => [
    i.name,
    i.email,
    i.phone,
    i.whatsapp,
    i.service,
    i.addlService,
    i.budget,
    i.message.replace(/\r?\n/g, " "), // collapse newlines for single-line cells
    i.status,
    new Date(i.createdAt).toISOString(),
  ]);
  downloadCsv(toCsv([header, ...rows]), `okomba-inquiries-${dateStamp()}.csv`);
}

export type SubscriberCsvRow = {
  email: string;
  status: string;
  createdAt: string;
};

export function exportSubscribersCsv(subscribers: SubscriberCsvRow[]): void {
  const header = ["Email", "Status", "Subscribed At"];
  const rows = subscribers.map((s) => [s.email, s.status, new Date(s.createdAt).toISOString()]);
  downloadCsv(toCsv([header, ...rows]), `okomba-subscribers-${dateStamp()}.csv`);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadCsv(csv: string, filename: string): void {
  // Prepend UTF-8 BOM so Excel opens it with correct encoding
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
