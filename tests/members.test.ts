import { describe, it, expect } from "vitest";
import type { Profile } from "@/lib/types";
import {
  filterMembers,
  countByStatus,
  parseMemberStatusFilter,
} from "@/lib/members";
import { getPicEligibleProfiles, getProfileCrossNames } from "@/lib/data";

function profile(overrides: Partial<Profile> & { id: string }): Profile {
  return {
    fullName: "Nama Lengkap",
    nickname: "Nama",
    whatsapp: null,
    birthDate: null,
    hometown: null,
    university: null,
    cohort: null,
    status: "active",
    notes: null,
    avatarUrl: null,
    serviceCount30d: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const dex = profile({ id: "p1", nickname: "Dex", fullName: "Dex Bennett" });
const angel = profile({
  id: "p2",
  nickname: "Angel",
  fullName: "Angel Maria",
  status: "away",
});
const oct = profile({
  id: "p3",
  nickname: "Ocvianty",
  fullName: "Ocvianty Rahma",
  status: "inactive",
});
const all = [dex, angel, oct];
const crosses = { p1: ["Cross Dex"], p2: ["Cross Angel"], p3: [] as string[] };

describe("filterMembers", () => {
  it("returns everyone when nothing is filtered", () => {
    expect(filterMembers(all, crosses, "", "all")).toEqual(all);
  });

  it("filters by status", () => {
    expect(filterMembers(all, crosses, "", "away")).toEqual([angel]);
  });

  it("matches nicknames case-insensitively", () => {
    expect(filterMembers(all, crosses, "dex", "all")).toEqual([dex]);
    expect(filterMembers(all, crosses, "ANGEL", "all")).toEqual([angel]);
  });

  it("matches full names and Cross names, not just nicknames", () => {
    expect(filterMembers(all, crosses, "bennett", "all")).toEqual([dex]);
    expect(filterMembers(all, crosses, "cross angel", "all")).toEqual([angel]);
  });

  it("combines query and status", () => {
    expect(filterMembers(all, crosses, "ex", "active")).toEqual([dex]);
    expect(filterMembers(all, crosses, "rahma", "inactive")).toEqual([oct]);
    expect(filterMembers(all, crosses, "rahma", "active")).toEqual([]);
  });
});

describe("parseMemberStatusFilter", () => {
  it("accepts the four real statuses", () => {
    for (const s of ["active", "away", "alumni", "inactive"] as const) {
      expect(parseMemberStatusFilter(s)).toBe(s);
    }
  });

  it("falls back to all for missing or forged values", () => {
    expect(parseMemberStatusFilter(undefined)).toBe("all");
    expect(parseMemberStatusFilter("member")).toBe("all");
    expect(parseMemberStatusFilter("")).toBe("all");
  });
});

describe("countByStatus", () => {
  it("counts every status — no group silently dropped from the header", () => {
    // The old header only counted active/away, hiding alumni/inactive.
    expect(countByStatus(all)).toEqual({
      active: 1,
      away: 1,
      alumni: 0,
      inactive: 1,
    });
  });
});

describe("getPicEligibleProfiles (demo)", () => {
  it("returns only the seed Cross leaders, never plain members", async () => {
    // No Supabase env in tests, so this runs the demo path: the same
    // rule production enforces (committee + active leaders), mirrored
    // honestly from seed memberships.
    const eligible = await getPicEligibleProfiles();
    const ids = eligible.map((p) => p.id).sort();
    expect(ids).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
  });
});

describe("getProfileCrossNames (demo)", () => {
  it("maps seed memberships to Cross names", async () => {
    const names = await getProfileCrossNames();
    expect(names["1"]).toBeDefined();
    expect(names["1"].length).toBeGreaterThan(0);
  });
});
