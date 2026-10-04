import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

// Fraunces carries the brand: upright for display, italic for the one accent
// phrase per screen. Geist Mono is the HUD voice — labels, dates, numbers —
// across the whole site, not only the dashboard.
//
// Only the body face (Geist Sans) is preloaded. On a slow phone connection
// four preloaded fonts (~400 KB) queued ahead of the stylesheet and pushed
// first paint to 2.5 s; display, italic and mono faces swap in instead
// (next/font sizes their fallbacks to keep the layout still).
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz"],
  preload: false,
});

// Same file as `geist/font/mono`, declared here so it can skip preloading.
const geistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Roboto Mono", "Menlo", "Consolas", "monospace"],
});

const frauncesItalic = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: "italic",
  variable: "--font-fraunces-italic",
  axes: ["opsz"],
  preload: false,
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
  // Icons come from the file convention (src/app/icon.png, apple-icon.png):
  // small rasters of the crest. The old vector crest was ~1 MB of traced
  // paths and was downloaded up to five times per visit.
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0a08",
  // Both schemes are real now: dark Nocturne by default, light Warta on
  // the committee dashboard via the theme toggle.
  colorScheme: "dark light",
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
    // suppressHydrationWarning: ThemeInitScript (DashboardTheme.tsx)
    // menyetel <html data-theme="light"> SEBELUM React hidrasi kalau user
    // menyimpan tema terang — atribut itu benar dan disengaja, bukan bug.
    // Tanpa ini, tiap user light-mode dapat overlay hydration-mismatch.
    // (Ekstensi browser seperti Dark Reader yang menyuntik atribut sendiri
    // ikut terbungkam — itu urusan browser user, bukan kode kita.)
    <html
      lang="id"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${fraunces.variable} ${frauncesItalic.variable} ${GeistSans.variable} ${geistMono.variable}`}
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
