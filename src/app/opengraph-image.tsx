import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Youth GKKK Jogja — Satu api, satu wadah.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card, in the same Nocturne skin as the site: near-black ground,
 * the crest as the only light, gold on the one accent word. Values mirror
 * the tokens in globals.css (canvas, ink, ink-faint, accent, rule). No
 * external fonts are fetched — the build must not depend on the network.
 */
export default async function Image() {
  const crest = await readFile(join(process.cwd(), "src/app/icon.png"));
  const crestSrc = `data:image/png;base64,${crest.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0f0a08",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
          color: "#f7efe2",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#908273",
            }}
          >
            <span style={{ color: "#fdbe02" }}>00</span>
            <span style={{ marginLeft: 18 }}>Komisi Pemuda GKKK Jogja</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", fontSize: 118, lineHeight: 0.95, letterSpacing: -4 }}>
            <div style={{ display: "flex" }}>
              Satu&nbsp;<span style={{ color: "#fdbe02", fontStyle: "italic" }}>api</span>,
            </div>
            <div style={{ display: "flex" }}>satu wadah.</div>
          </div>

          <div
            style={{
              display: "flex",
              borderTop: "1px solid #3a2a24",
              paddingTop: 24,
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#908273",
            }}
          >
            Ibadah Pemuda · Sabtu 17.00 WIB · Ruang Hermon
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 330 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={crestSrc} width={300} height={300} alt="" />
        </div>
      </div>
    ),
    size
  );
}
