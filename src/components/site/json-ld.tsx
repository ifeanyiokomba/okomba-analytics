/* Server component — renders schema.org JSON-LD for the marketing site.
 *
 * Data is sourced from the SAME single source of truth the UI renders
 * (src/lib/content.ts), so the structured data can never drift from what
 * visitors actually see:
 *   - Organization / ProfessionalService → firm identity, contact, coverage
 *   - WebSite → site identity linked to the publisher
 *
 * (FAQPage JSON-LD is already emitted next to the visible FAQ accordion in
 * faq-section.tsx — intentionally NOT duplicated here.)
 *
 * Rendered once from the root server layout so every crawl of / carries it.
 */
import { CONTACT } from "@/lib/content";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://okomba.com";

const organization = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": `${siteUrl}/#organization`,
  name: "Okomba Analytics",
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  email: CONTACT.email,
  telephone: "+2348088948657",
  description:
    "Professional digital services and technology company building web applications, fintech solutions, payment systems, automation and digital operations for startups, SMEs and organizations.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "NG",
  },
  areaServed: ["Nigeria", "Global"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: CONTACT.email,
    telephone: "+2348088948657",
    availableLanguage: ["English"],
    areaServed: ["NG", "Global"],
  },
};

const website = {
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "Okomba Analytics",
  description:
    "Digital Products, Systems & Experiences — web development, fintech solutions, payment systems, automation and digital operations.",
  publisher: { "@id": `${siteUrl}/#organization` },
  inLanguage: "en",
};

export function JsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  };
  return (
    <script
      type="application/ld+json"
      // Static, server-generated structured data from trusted constants.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
