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
  },
  twitter: {
    card: "summary_large_image",
    title: "Okomba Analytics — Digital Products, Systems & Experiences",
    description:
      "Web development, fintech solutions, payment systems, automation and digital operations — engineered to move your business forward.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
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
      </body>
    </html>
  );
}
