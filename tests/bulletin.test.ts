import { describe, expect, it } from "vitest";
import { nextSaturdayService, parseBulletin, slotsFilled } from "@/lib/bulletin";

describe("parseBulletin", () => {
  it("keeps bulletin fields and drops malformed rows", () => {
    const b = parseBulletin({
      upcoming: [
        { date: "2026-10-10T10:00:00+00:00", theme: "Tema", type: "worship", status: "published", speaker: "Pdt. A", description: "x", roles: { WL: 1, Singer: 2 } },
        { date: null, theme: "tanpa tanggal" },
        "rusak",
      ],
      latest: { date: "2026-09-26T10:00:00+00:00", theme: "Terakhir", type: "worship" },
      cross_schedule: [{ day: "Sabtu", time: "19:00", groups: 5 }, { day: "Jumat", groups: 0 }],
      counts: { events: 35, assignments: 217, members: 93, crosses: 5 },
    });
    expect(b).not.toBeNull();
    expect(b!.upcoming).toHaveLength(1);
    expect(b!.upcoming[0].roles).toEqual({ WL: 1, Singer: 2 });
    expect(b!.latest?.theme).toBe("Terakhir");
    expect(b!.crossSchedule).toEqual([{ day: "Sabtu", time: "19:00", groups: 5 }]);
    expect(b!.counts).toEqual({ events: 35, assignments: 217, members: 93, crosses: 5 });
  });

  it("never invents numbers when counts are missing", () => {
    const b = parseBulletin({ upcoming: [], cross_schedule: [] });
    expect(b!.counts).toEqual({ events: 0, assignments: 0, members: 0, crosses: 0 });
    expect(b!.latest).toBeNull();
  });

  it("has no field that could carry a group or person name", () => {
    const b = parseBulletin({ cross_schedule: [{ day: "Sabtu", time: "19:00", groups: 2, name: "Cross X" }] });
    expect(Object.keys(b!.crossSchedule[0]).sort()).toEqual(["day", "groups", "time"]);
  });

  it("rejects non-objects", () => {
    expect(parseBulletin(null)).toBeNull();
    expect(parseBulletin("x")).toBeNull();
  });
});

describe("slotsFilled", () => {
  it("counts against the weekly minimum of 8", () => {
    expect(slotsFilled({})).toEqual({ filled: 0, needed: 8 });
    expect(slotsFilled({ WL: 1, Singer: 2, Pemusik: 1, Multimedia: 1, Sound: 1, Usher: 2 })).toEqual({
      filled: 8,
      needed: 8,
    });
  });

  it("does not let an extra person in one role cover an empty role", () => {
    // 4 Pemusik + 3 Singer, nobody else: Pemusik counts 1, Singer counts 2.
    expect(slotsFilled({ Pemusik: 4, Singer: 3 })).toEqual({ filled: 3, needed: 8 });
  });

  it("ignores roles that are not steward roles", () => {
    expect(slotsFilled({ Liturgos: 3 })).toEqual({ filled: 0, needed: 8 });
  });
});

describe("nextSaturdayService", () => {
  // Saturday 17:00 WIB = 10:00 UTC.
  it("finds the coming Saturday from midweek", () => {
    const wed = new Date("2026-10-07T05:00:00Z"); // Rabu 12:00 WIB
    expect(nextSaturdayService(wed).toISOString()).toBe("2026-10-10T10:00:00.000Z");
  });

  it("stays on today while the service is on or just finished", () => {
    const satEvening = new Date("2026-10-10T11:30:00Z"); // Sabtu 18:30 WIB
    expect(nextSaturdayService(satEvening).toISOString()).toBe("2026-10-10T10:00:00.000Z");
  });

  it("moves to next week once the evening is over", () => {
    const satNight = new Date("2026-10-10T13:00:00Z"); // Sabtu 20:00 WIB
    expect(nextSaturdayService(satNight).toISOString()).toBe("2026-10-17T10:00:00.000Z");
  });

  it("treats Sunday as six days out", () => {
    const sun = new Date("2026-10-04T00:00:00Z"); // Minggu 07:00 WIB
    expect(nextSaturdayService(sun).toISOString()).toBe("2026-10-10T10:00:00.000Z");
  });
});
