import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import ChatWidget from "@/components/chat/ChatWidget";

const suisse = Inter({
  variable: "--font-suisse",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://buildhawk.com.au");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "BuildHawk · Powered by Hawktress™ · Precision Estimating. Disciplined Delivery.",
  description:
    "BuildHawk Pty Ltd is a back-end partner for builders, developers and owner-builders, delivering its work through the Hawktress™ platform. We protect profit margins, control project costs and strengthen construction execution from tender through completion.",
  icons: {
    icon: "/brand/favicon-32.png",
  },
  openGraph: {
    type: "website",
    siteName: "BuildHawk",
    url: SITE_URL,
    title: "BuildHawk · Powered by Hawktress™",
    description:
      "Precision estimating, contract administration and live margin tracking for Australian residential builders, trades and suppliers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildHawk · Powered by Hawktress™",
    description:
      "Precision estimating, contract administration and live margin tracking for Australian residential builders, trades and suppliers.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "x587V8hUpRsQrDyTzAbb1dYbS6Rir6dyZhGjQJV088M",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${suisse.variable} h-full`}>
      <body className="min-h-full bg-bh-white text-bh-black antialiased">
        <SmoothScroll />
        {children}
        <ChatWidget />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
