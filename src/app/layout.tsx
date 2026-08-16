import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time by next/font. This replaces the previous
// render-blocking <link> to fonts.googleapis.com: two fewer DNS/TLS
// round-trips on first paint, and next/font emits a size-adjusted
// fallback so the swap no longer shifts layout.
//
// Only the optical-size axis is requested. SOFT and WONK were costing
// bytes on every phone to alter a handful of display glyphs.
//
// Geist Mono is deliberately NOT loaded: it was 70 KB serving only the
// 10-11px uppercase micro-labels, where the letterspacing carries the
// character and a system mono is indistinguishable.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  // Required for the OG image and canonical URLs to resolve absolutely.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Space Youth — Komisi Pemuda GKKK Yogyakarta",
    template: "%s · Space Youth GKKK",
  },
  description:
    "Rumah digital Komisi Pemuda GKKK Yogyakarta. Jadwal ibadah Sabtu, penatalayan, kelompok Cross, dan catatan pelayanan — di satu tempat.",
  applicationName: "Space Youth GKKK",
  authors: [{ name: "Komisi Pemuda GKKK Yogyakarta" }],
  keywords: ["GKKK", "Pemuda", "Yogyakarta", "Cross", "ibadah", "penatalayan"],
  openGraph: {
    title: "Space Youth — Komisi Pemuda GKKK Yogyakarta",
    description:
      "Jadwal ibadah Sabtu, penatalayan, kelompok Cross, dan catatan pelayanan — di satu tempat.",
    locale: "id_ID",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
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
      className={`${fraunces.variable} ${GeistSans.variable}`}
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
