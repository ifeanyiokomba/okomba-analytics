import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClientPortalView } from "@/components/portal/client-portal-view";

export const dynamic = "force-dynamic";

/* Private per-invoice secure links must never be indexed or cached by
 * search engines (tokens are capability URLs). Also give the tab a sane
 * title instead of the default template. */
export const metadata = {
  title: "Secure Invoice Portal",
  description: "Your secure Okomba Analytics invoice and payment portal.",
  robots: { index: false, follow: false, nocache: true },
};

/* ------------------------------------------------------------------ */
/* /portal/[secureToken] — Client Portal (Module 8A, production route) */
/*                                                                      */
/* Server component: validates the token before rendering so invalid    */
/* links 404 cleanly (no client-side flash). Delegates the UI to the    */
/* client component that fetches the same data via /api/portal/[token].  */
/* ------------------------------------------------------------------ */

const ALLOWED_STATUSES = new Set(["draft", "sent", "pending", "paid", "overdue", "cancelled"]);

export default async function PortalPage({
  params,
}: {
  params: Promise<{ secureToken: string }>;
}) {
  const { secureToken } = await params;
  if (
    !secureToken ||
    secureToken.length < 16 ||
    secureToken.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(secureToken)
  ) {
    notFound();
  }

  const invoice = await db.invoice.findUnique({
    where: { secureToken },
    select: { id: true, status: true },
  });
  if (!invoice || !ALLOWED_STATUSES.has(invoice.status)) {
    notFound();
  }

  return <ClientPortalView token={secureToken} />;
}
