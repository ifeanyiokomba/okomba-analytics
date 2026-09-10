import type { MetadataRoute } from "next";

/* Production-aware site URL — mirrors layout.tsx (NEXT_PUBLIC_SITE_URL is
   https://okomba.com in production; local dev falls back to it too so the
   generated robots.txt is always the real crawl contract). */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://okomba.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/* is machine-only; /portal/* carries private per-invoice secure
      // tokens that must never be crawled or appear in search results.
      disallow: ["/api/", "/portal/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
