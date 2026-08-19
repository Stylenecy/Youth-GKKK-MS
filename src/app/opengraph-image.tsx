import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/site";

export const alt = "Youth — Komisi Pemuda GKKK Yogyakarta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card. Uses the same paper/ink palette as the site so a link pasted
 * into a WhatsApp group already looks like the ministry's own material.
 * No external fonts are fetched — the build must not depend on the network.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf7f2",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#a94d08",
            }}
          />
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#756a60",
              fontFamily: "monospace",
            }}
          >
            {SITE_TAGLINE}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 112,
              lineHeight: 1.05,
              letterSpacing: -3,
              color: "#241f1b",
              fontWeight: 600,
            }}
          >
            Youth
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 34,
              lineHeight: 1.4,
              color: "#6f655c",
              maxWidth: 820,
            }}
          >
            Jadwal ibadah Sabtu, penatalayan, dan kelompok Cross — di satu tempat.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "2px solid #ded4c6",
            paddingTop: 28,
            fontSize: 24,
            color: "#756a60",
            fontFamily: "monospace",
            letterSpacing: 2,
          }}
        >
          SABTU · 17.00 WIB
        </div>
      </div>
    ),
    size
  );
}
