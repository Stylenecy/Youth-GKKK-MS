import type { Metadata, Viewport } from "next";
import { Fraunces, Kaushan_Script } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const kaushan = Kaushan_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-handwriting",
});

export const metadata: Metadata = {
  // Required for the OG image and canonical URLs to resolve absolutely.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Youth — Komisi Pemuda GKKK Yogyakarta",
    template: "%s · Youth GKKK",
  },
  description:
    "Rumah digital Komisi Pemuda GKKK Yogyakarta. Jadwal ibadah Sabtu, penatalayan, kelompok Cross, dan catatan pelayanan — di satu tempat.",
  applicationName: "Youth GKKK",
  authors: [{ name: "Komisi Pemuda GKKK Yogyakarta" }],
  keywords: ["GKKK", "Pemuda", "Yogyakarta", "Cross", "ibadah", "penatalayan"],
  openGraph: {
    title: "Youth — Komisi Pemuda GKKK Yogyakarta",
    description:
      "Jadwal ibadah Sabtu, penatalayan, kelompok Cross, dan catatan pelayanan — di satu tempat.",
    locale: "id_ID",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo/derived/logo-super-transparent.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/logo/derived/logo-super-transparent.svg",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Deliberately NOT capping maximumScale — users must be able to
  // pinch-zoom (WCAG 1.4.4).
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${kaushan.variable} ${GeistSans.variable}`}
    >
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Lompat ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
