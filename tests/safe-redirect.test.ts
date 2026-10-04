import { describe, expect, it } from "vitest";
import { safeRedirectUrl } from "@/lib/safe-redirect";

const ORIGIN = "https://youth-gkkk-ms.vercel.app";

describe("safeRedirectUrl", () => {
  it("keeps same-site paths, with query and hash", () => {
    expect(safeRedirectUrl("/dashboard/penatalayan", ORIGIN)).toBe(`${ORIGIN}/dashboard/penatalayan`);
    expect(safeRedirectUrl("/dashboard?tab=kas#x", ORIGIN)).toBe(`${ORIGIN}/dashboard?tab=kas#x`);
  });

  it("falls back to the dashboard when next is missing", () => {
    expect(safeRedirectUrl(null, ORIGIN)).toBe(`${ORIGIN}/dashboard`);
    expect(safeRedirectUrl("", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it("refuses every way of leaving the site", () => {
    for (const bad of [
      "@evil.com",
      ".evil.com",
      "evil.com",
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
    ]) {
      const url = new URL(safeRedirectUrl(bad, ORIGIN));
      expect(url.origin, bad).toBe(ORIGIN);
      expect(url.pathname, bad).toBe("/dashboard");
    }
  });
});
