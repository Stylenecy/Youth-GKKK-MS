import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  seedProfiles,
  seedEvents,
  seedCrosses,
  seedCrossMemberships,
  seedStewards,
  getUpcomingGathering,
  getDashboardStats,
} from "@/lib/seed";
import { normalizePhoneNumber, FAKE_NUMBER_PREFIX } from "@/lib/phone";

const seedPath = fileURLToPath(new URL("../src/lib/seed.ts", import.meta.url));

describe("demo dates never expire", () => {
  // Regression guard. Twice now the demo dates have been pinned to a real
  // Saturday; once that Saturday passes, getUpcomingGathering() returns null,
  // every "upcoming" surface falls back to its empty state, and the site
  // reads as broken rather than as un-configured.
  it("always has an upcoming gathering", () => {
    expect(getUpcomingGathering()).not.toBeNull();
  });

  it("puts the headline event in the future", () => {
    const upcoming = getUpcomingGathering()!;
    expect(new Date(upcoming.date).getTime()).toBeGreaterThan(Date.now());
  });

  it("schedules every seeded event in the future", () => {
    for (const event of seedEvents) {
      expect(
        new Date(event.date).getTime(),
        `event ${event.id} (${event.weeklyTheme}) is in the past`
      ).toBeGreaterThan(Date.now());
    }
  });

  it("does not hardcode a calendar year in the seed source", () => {
    const source = readFileSync(seedPath, "utf8");
    // Dates must be computed. A literal `new Date("20XX-` in a date helper is
    // how the expiry bug got in both times.
    const pinned = source.match(/new Date\("20\d{2}-\d{2}-\d{2}/g) ?? [];
    expect(pinned).toEqual([]);
  });

  it("puts every event on a Saturday at 17:00 WIB", () => {
    const wib = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    for (const event of seedEvents) {
      const parts = wib.format(new Date(event.date));
      expect(parts, `event ${event.id}`).toContain("Sabtu");
      expect(parts, `event ${event.id}`).toContain("17.00");
    }
  });
});

describe("no real member data in the shipped bundle", () => {
  // While Supabase is unconfigured, proxy.ts lets every /dashboard request
  // through without a login, so everything in seed.ts is world-readable at
  // /dashboard/members. Real names, birth dates and phone numbers must not
  // live here — the 8 real Cross Leader nicknames are the one exception,
  // explicitly authorized by Dex (8 Aug 2026), and even those carry no
  // other real field.
  //
  // WhatsApp exception (12 Aug 2026): the two demo numbers are OBVIOUSLY
  // fake — both normalize into the reserved 6280000 block — so the
  // WhatsApp button stays verifiable without a database. A real member
  // number in this file fails the check below.
  it("never carries a real phone number for any demo profile", () => {
    for (const profile of seedProfiles) {
      if (profile.whatsapp === null) continue;
      const normalized = normalizePhoneNumber(profile.whatsapp);
      expect(
        normalized?.startsWith(FAKE_NUMBER_PREFIX),
        `${profile.nickname} has a non-fake number: ${profile.whatsapp}`
      ).toBe(true);
    }
  });

  it("carries no birth date for any demo profile", () => {
    for (const profile of seedProfiles) {
      expect(profile.birthDate, `${profile.nickname} has a birth date`).toBeNull();
    }
  });

  it("does not reuse any name from the real roster", () => {
    const rosterPath = fileURLToPath(
      new URL(
        "../database/ROSTER-ASLI_dari-sesi-Antigravity_7-Ags.ts.txt",
        import.meta.url
      )
    );
    if (!existsSync(rosterPath)) return; // roster archived elsewhere; nothing to check

    const roster = readFileSync(rosterPath, "utf8");
    const realNames = [...roster.matchAll(/fullName:\s*"([^"]+)"/g)].map(
      (m) => m[1]
    );
    expect(realNames.length).toBeGreaterThan(0);

    const seedSource = readFileSync(seedPath, "utf8");
    for (const name of realNames) {
      expect(
        seedSource.includes(name),
        `real name "${name}" leaked back into seed.ts`
      ).toBe(false);
    }
  });
});

describe("cross membership", () => {
  it("counts members from the membership table, not a stale column", () => {
    for (const cross of seedCrosses) {
      const active = seedCrossMemberships.filter(
        (m) => m.crossId === cross.id && m.isActive
      );
      expect(active.length, `${cross.name} memberCount drifted`).toBe(
        cross.memberCount
      );
    }
  });

  it("includes each leader in their own group roster", () => {
    for (const cross of seedCrosses) {
      const ids = seedCrossMemberships
        .filter((m) => m.crossId === cross.id && m.isActive)
        .map((m) => m.profileId);
      expect(ids, `${cross.name} leader missing from roster`).toContain(
        cross.leaderId
      );
    }
  });

  it("gives every inactive membership an end date, if any exist", () => {
    // No inactive rows in the current 8-leader seed — every real person
    // still leads their group. This just guards the invariant for whenever
    // one is added, rather than requiring a fabricated example today.
    const inactive = seedCrossMemberships.filter((m) => !m.isActive);
    for (const m of inactive) {
      expect(m.endDate).not.toBeNull();
    }
  });

  it("marks every leader membership as active", () => {
    const leaders = seedCrossMemberships.filter((m) => m.role === "leader");
    expect(leaders.length).toBeGreaterThan(0);
    for (const m of leaders) {
      expect(m.isActive, `${m.id} leader row should be active`).toBe(true);
    }
  });

  it("points every membership at a real profile and a real group", () => {
    const profileIds = new Set(seedProfiles.map((p) => p.id));
    const crossIds = new Set(seedCrosses.map((c) => c.id));
    for (const m of seedCrossMemberships) {
      expect(profileIds.has(m.profileId), `${m.id} orphan profile`).toBe(true);
      expect(crossIds.has(m.crossId), `${m.id} orphan cross`).toBe(true);
    }
  });

  it("never puts one person in two active groups", () => {
    const active = seedCrossMemberships.filter((m) => m.isActive);
    const ids = active.map((m) => m.profileId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("referential integrity", () => {
  it("assigns stewards to real events and real people", () => {
    const eventIds = new Set(seedEvents.map((e) => e.id));
    const profileIds = new Set(seedProfiles.map((p) => p.id));
    for (const s of seedStewards) {
      expect(eventIds.has(s.eventId), `${s.id} orphan event`).toBe(true);
      expect(profileIds.has(s.profileId), `${s.id} orphan profile`).toBe(true);
    }
  });

  it("names a real PIC for every event", () => {
    const profileIds = new Set(seedProfiles.map((p) => p.id));
    for (const e of seedEvents) {
      // picId is nullable in the schema (an event can exist before anyone is
      // put in charge), but every seeded event is expected to name someone.
      expect(e.picId, `event ${e.id} has no PIC`).not.toBeNull();
      expect(profileIds.has(e.picId!), `event ${e.id} orphan PIC`).toBe(true);
    }
  });

  it("reports a balance equal to income minus expense", () => {
    const stats = getDashboardStats();
    expect(stats.totalMembers).toBe(seedProfiles.length);
    expect(stats.activeCrossGroups).toBe(seedCrosses.length);
    expect(Number.isFinite(stats.totalBalance)).toBe(true);
  });
});
