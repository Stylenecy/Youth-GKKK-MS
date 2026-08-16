import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import WhatsAppButton from "@/components/WhatsAppButton";

const dataSource = readFileSync(
  fileURLToPath(new URL("../src/lib/data.ts", import.meta.url)),
  "utf8"
);

describe("WhatsAppButton (server render)", () => {
  it("renders a wa.me link with an accessible label when a number exists", () => {
    const html = renderToStaticMarkup(
      <WhatsAppButton number="0812-3456-7890" name="Wangke" />
    );
    expect(html).toContain("https://wa.me/6281234567890");
    expect(html).toContain("Chat via WhatsApp dengan Wangke");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renders nothing when the number is missing", () => {
    const html = renderToStaticMarkup(
      <WhatsAppButton number={null} name="Angel" />
    );
    expect(html).toBe("");
  });

  it("respects the className prop (defaults to btn-outline)", () => {
    const html = renderToStaticMarkup(
      <WhatsAppButton number="0812-3456-7890" name="Wangke" className="btn-primary" />
    );
    expect(html).toContain('class="btn-primary"');
  });
});

describe("member never receives the phone field (T3, app side)", () => {
  // Layer (b) of the gate is UI; layer (a) is the database (column-level
  // revoke + role-gated RPC in migration 0006). This test pins the app
  // half: every profile query uses the PROFILE_COLUMNS constant, so if it
  // ever gains "whatsapp" — or someone swaps back to `select("*")` — a
  // plain member's API response would carry numbers again. That is a test
  // failure, not a UI concern.
  it("PROFILE_COLUMNS excludes the whatsapp column", () => {
    const definition = dataSource.match(/const PROFILE_COLUMNS\s*=\s*"([^"]+)"/);
    expect(definition, "PROFILE_COLUMNS constant found").not.toBeNull();
    expect(definition![1]).not.toContain("whatsapp");
  });

  it("no profile query falls back to select(*)", () => {
    // The whatsapp column is column-level revoked from anon + authenticated,
    // so `select("*")` on profiles would throw at runtime instead of
    // leaking — but it must never reappear for any reason.
    const selectStar = dataSource.match(
      /\.from\("profiles"\)\.select\("\*"\)/g
    );
    expect(selectStar).toBeNull();
  });
});

