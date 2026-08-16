import { describe, it, expect } from "vitest";
import {
  getCrosses,
  getCrossLeaders,
  getCrossMembers,
  getAllCrossLeaderNicknames,
  getCrossMemberCounts,
  getCurrentProfile,
  getMyLeaderCrossIds,
  isSupabaseConfigured,
} from "@/lib/data";

// vitest never sets NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, so every call below
// exercises the demo-mode branch — exactly the code path the real app
// falls back to before Dex finishes wiring Supabase.
describe("demo mode has no ambient Supabase config", () => {
  it("isSupabaseConfigured() is false", () => {
    expect(isSupabaseConfigured()).toBe(false);
  });
});

describe("getCrossLeaders (demo)", () => {
  it("returns every co-leader for a shared group", async () => {
    const crosses = await getCrosses();
    const shared = crosses.find((c) => c.name === "Cross Wangke & Arion");
    expect(shared).toBeDefined();

    const leaders = await getCrossLeaders(shared!.id);
    expect(leaders.map((l) => l.nickname).sort()).toEqual(["Arion", "Wangke"]);
  });

  it("returns exactly one leader for a solo-led group", async () => {
    const crosses = await getCrosses();
    const solo = crosses.find((c) => c.name === "Cross Nathan");
    const leaders = await getCrossLeaders(solo!.id);
    expect(leaders.map((l) => l.nickname)).toEqual(["Nathan"]);
  });

  it("returns an empty array for a group with no id match", async () => {
    const leaders = await getCrossLeaders("does-not-exist");
    expect(leaders).toEqual([]);
  });
});

describe("getAllCrossLeaderNicknames (demo)", () => {
  it("maps every cross to its leader nicknames in one pass", async () => {
    const crosses = await getCrosses();
    const map = await getAllCrossLeaderNicknames();

    for (const cross of crosses) {
      const direct = await getCrossLeaders(cross.id);
      expect(
        (map[cross.id] ?? []).sort(),
        `${cross.name} leader set should match getCrossLeaders`
      ).toEqual(direct.map((l) => l.nickname).sort());
    }
  });
});

describe("getCrossMemberCounts (demo)", () => {
  it("counts match getCrossMembers length for every group", async () => {
    const crosses = await getCrosses();
    const counts = await getCrossMemberCounts();

    for (const cross of crosses) {
      const members = await getCrossMembers(cross.id);
      expect(counts[cross.id] ?? 0, cross.name).toBe(members.length);
    }
  });
});

describe("session-aware helpers outside a real session", () => {
  // Demo mode has no login concept at all, so these must fail safe —
  // never throw, never claim someone is signed in.
  it("getCurrentProfile() returns null", async () => {
    expect(await getCurrentProfile()).toBeNull();
  });

  it("getMyLeaderCrossIds() returns an empty array", async () => {
    expect(await getMyLeaderCrossIds()).toEqual([]);
  });
});
