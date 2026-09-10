import type { MetadataRoute } from "next";

/* Web App Manifest — makes okomba.com installable and gives Android/Chrome
   the correct brand mark + colors for the splash screen. Icons reuse the
   existing public assets (SVG brand mark + PNG fallbacks). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Okomba Analytics — Digital Products, Systems & Experiences",
    short_name: "Okomba Analytics",
    description:
      "Web development, fintech solutions, payment systems, automation and digital operations — engineered to move your business forward.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["business", "technology", "productivity"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
