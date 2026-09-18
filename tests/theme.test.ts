import { describe, it, expect } from "vitest";
import { parseDashboardTheme } from "@/lib/theme";

describe("parseDashboardTheme", () => {
  it("keeps an explicit light choice", () => {
    expect(parseDashboardTheme("light")).toBe("light");
  });

  it("keeps dark", () => {
    expect(parseDashboardTheme("dark")).toBe("dark");
  });

  it("falls back to dark for anything else — never a broken state", () => {
    // A corrupted localStorage value must not leave the dashboard
    // unthemed; dark is the default everyone already knows.
    expect(parseDashboardTheme(null)).toBe("dark");
    expect(parseDashboardTheme(undefined)).toBe("dark");
    expect(parseDashboardTheme("")).toBe("dark");
    expect(parseDashboardTheme("LIGHT")).toBe("dark");
    expect(parseDashboardTheme(42)).toBe("dark");
  });
});
