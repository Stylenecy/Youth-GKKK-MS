import { describe, it, expect } from "vitest";
import { validateMemberName, STEWARD_ROLES, isStewardRole } from "@/lib/validation";

describe("validateMemberName", () => {
  it("accepts an ordinary name", () => {
    const result = validateMemberName("Budi");
    expect(result).toEqual({ ok: true, value: "Budi" });
  });

  it("trims surrounding whitespace", () => {
    const result = validateMemberName("  Budi  ");
    expect(result).toEqual({ ok: true, value: "Budi" });
  });

  it("rejects an empty name", () => {
    const result = validateMemberName("");
    expect(result.ok).toBe(false);
  });

  it("rejects a name that is only whitespace", () => {
    const result = validateMemberName("   ");
    expect(result.ok).toBe(false);
  });

  it("accepts exactly 80 characters", () => {
    const name = "a".repeat(80);
    const result = validateMemberName(name);
    expect(result).toEqual({ ok: true, value: name });
  });

  it("rejects 81 characters", () => {
    const result = validateMemberName("a".repeat(81));
    expect(result.ok).toBe(false);
  });
});

describe("STEWARD_ROLES", () => {
  it("covers exactly the six slots the ministry fills", () => {
    // The audit found assignSteward() accepted any string; the form and
    // the action now share this list, so a typo can never reach the table.
    expect([...STEWARD_ROLES]).toEqual([
      "WL",
      "Singer",
      "Pemusik",
      "Multimedia",
      "Sound",
      "Usher",
    ]);
  });

  it("accepts a known role and rejects anything else", () => {
    expect(isStewardRole("WL")).toBe(true);
    expect(isStewardRole("wl")).toBe(false);
    expect(isStewardRole("Pendeta")).toBe(false);
    expect(isStewardRole("")).toBe(false);
  });
});
