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
    template: "%s — Sentinel",
    default: "Sentinel — Serverless uptime monitoring",
  },
  description: "Serverless uptime monitoring and incident alerting. Get notified the moment a service goes down.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Sentinel — Serverless uptime monitoring",
    description: "Serverless uptime monitoring and incident alerting. Get notified the moment a service goes down.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Sentinel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentinel — Serverless uptime monitoring",
    description: "Serverless uptime monitoring and incident alerting.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
