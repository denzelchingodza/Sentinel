import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://sentinel-kappa-wine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s · Sentinel",
    default: "Sentinel — URL monitoring on AWS",
  },
  description: "URL monitoring on AWS. Checks every 60 seconds and emails you when something goes down.",
  keywords: ["uptime monitoring", "URL monitoring", "AWS", "website monitoring", "downtime alerts"],
  authors: [{ name: "Denzel Chingodza" }],
  creator: "Denzel Chingodza",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Sentinel — URL monitoring on AWS",
    description: "URL monitoring on AWS. Checks every 60 seconds and emails you when something goes down.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Sentinel" }],
    locale: "en_US",
    siteName: "Sentinel",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentinel — URL monitoring on AWS",
    description: "URL monitoring on AWS. Checks every 60 seconds.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sentinel",
  },
  other: {
    "theme-color": "#080f1a",
    "color-scheme": "dark",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
