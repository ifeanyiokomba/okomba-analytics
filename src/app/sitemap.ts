import type { MetadataRoute } from "next";

/* Single public URL (the marketing site is one page with hash-routed
   portals that are intentionally not crawlable). Keep the canonical
   production domain — previously this pointed at the legacy Cloudflare
   Pages URL, which split crawl signals across two hosts. */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://okomba.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
