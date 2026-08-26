import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
    icon: "/favicon.svg",
    apple: "/favicon.svg",
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

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";

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
        {/* Google Analytics 4 (Module 8C) — only loads when configured */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4_ID}',{anonymize_ip:true});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
