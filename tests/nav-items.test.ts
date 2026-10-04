import { describe, it, expect } from "vitest";
import { NAV_ITEMS, isActive } from "@/components/nav-items";

const activeFor = (path: string) => NAV_ITEMS.filter((i) => isActive(path, i.href)).map((i) => i.label);

describe("isActive", () => {
  it("marks exactly one item on nested routes", () => {
    expect(activeFor("/dashboard/cross/mine")).toEqual(["Kelompokku"]);
    expect(activeFor("/dashboard/cross/c1")).toEqual(["Cross"]);
    expect(activeFor("/dashboard/cross")).toEqual(["Cross"]);
  });

  it("keeps Dashboard to the home route only", () => {
    expect(activeFor("/dashboard")).toEqual(["Dashboard"]);
    expect(activeFor("/dashboard/members/1")).toEqual(["Anggota"]);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(isActive("/dashboard/crossword", "/dashboard/cross")).toBe(false);
  });
});
