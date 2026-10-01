import { describe, it, expect } from "vitest";
import { neutralizeFormula, toCsv } from "@/lib/csv";

describe("neutralizeFormula", () => {
  it("prefixes cells Excel would run as a formula", () => {
    expect(neutralizeFormula('=HYPERLINK("http://x","klik")')).toBe(`'=HYPERLINK("http://x","klik")`);
    expect(neutralizeFormula("+62 812")).toBe("'+62 812");
    expect(neutralizeFormula("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(neutralizeFormula("-lain")).toBe("'-lain");
  });

  it("leaves plain numbers (including negatives) and text alone", () => {
    expect(neutralizeFormula("350000")).toBe("350000");
    expect(neutralizeFormula("-85000")).toBe("-85000");
    expect(neutralizeFormula("Snack latihan")).toBe("Snack latihan");
  });
});

describe("toCsv", () => {
  it("quotes every cell and doubles inner quotes", () => {
    expect(toCsv([["a", 'b "c"'], ["=1+1", "2"]])).toBe(
      `"a","b ""c"""\n"'=1+1","2"`
    );
  });
});
