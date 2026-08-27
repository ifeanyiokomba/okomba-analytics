import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://okomba-analytics.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Okomba Analytics — Digital Products, Systems & Experiences",
    template: "%s | Okomba Analytics",
  },
  description:
    "Okomba Analytics is a professional digital services and technology company building web applications, fintech solutions, payment systems, automation and digital operations for startups, SMEs and organizations.",
  keywords: [
    "Okomba Analytics",
    "web development Nigeria",
    "fintech solutions",
    "payment integration",
    "digital operations",
    "web applications",
    "automation",
    "data analysis",
    "digital services",
  ],
  authors: [{ name: "Okomba Analytics" }],
  creator: "Okomba Analytics",
  icons: {
    // SVG brand mark is primary (modern browsers + Chrome/Firefox
    // support animated SVG favicons — the z-breathe pulse lives on).
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    // Apple requests a square PNG (180x180 ideal). SVG doesn't render
    // for apple-touch-icon in iOS Safari, so use the PNG render.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.svg"],
  },
  openGraph: {
    title: "Okomba Analytics — Digital Products, Systems & Experiences",
    description:
      "Web development, fintech solutions, payment systems, automation and digital operations — engineered to move your business forward.",
    url: siteUrl,
    siteName: "Okomba Analytics",
    type: "website",
    locale: "en_NG",
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "Okomba Analytics — Digital Products, Systems & Experiences",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Okomba Analytics — Digital Products, Systems & Experiences",
    description:
      "Web development, fintech solutions, payment systems, automation and digital operations — engineered to move your business forward.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        {/*
          Google Analytics 4 (Module 8C) is NOT loaded here unconditionally.
          It is consent-gated: the CookieConsent component calls
          loadThirdPartyScripts() (src/lib/consent-scripts.ts) only after
          the visitor accepts cookies. This honours the cookie contract
          and the original Phase-1 Module-1 design. trackEvent() in
          src/lib/analytics.ts still pushes to window.dataLayer so the
          funnel stays debuggable before consent.
        */}
      </body>
    </html>
  );
}
