import { describe, it, expect } from "vitest";
import { validateMemberName } from "@/lib/validation";

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
