import { describe, it, expect } from "vitest";
import { mapAttendanceRow, canRecordAttendance } from "../src/lib/attendance";
import { getAttendanceByEvent } from "../src/lib/data";

const row = {
  id: "att-1",
  event_id: "event-1",
  profile_id: "profile-1",
  present: true,
  note: null,
  recorded_at: "2026-08-08T10:00:00Z",
};

describe("mapAttendanceRow", () => {
  it("maps snake_case to camelCase without losing the verdict", () => {
    // The bug this guards (19 Ags data-layer audit): casting DB rows left
    // every camelCase field silently undefined. Mapping is checked, not
    // promised.
    const mapped = mapAttendanceRow(row);
    expect(mapped).toEqual({
      id: "att-1",
      eventId: "event-1",
      profileId: "profile-1",
      present: true,
      note: null,
      recordedAt: "2026-08-08T10:00:00Z",
    });
  });

  it("keeps an explicit absence (present=false is data, not nothing)", () => {
    // A missing row means "not yet recorded"; present=false means someone
    // looked and the person was not there. Collapsing the two would make
    // "belum dicatat" indistinguishable from "dicatat tidak hadir".
    expect(mapAttendanceRow({ ...row, present: false }).present).toBe(false);
  });

  it("passes a recorder note through", () => {
    expect(mapAttendanceRow({ ...row, note: "Izin" }).note).toBe("Izin");
  });
});

describe("canRecordAttendance", () => {
  it("lets each committee role record", () => {
    for (const appRole of ["admin", "treasurer", "ministry"] as const) {
      expect(
        canRecordAttendance({ appRole, isEventPic: false, leadsAnyCross: false })
      ).toBe(true);
    }
  });

  it("lets the event PIC record without any other role", () => {
    expect(
      canRecordAttendance({ appRole: "member", isEventPic: true, leadsAnyCross: false })
    ).toBe(true);
  });

  it("lets a cross leader record", () => {
    expect(
      canRecordAttendance({ appRole: "leader", isEventPic: false, leadsAnyCross: true })
    ).toBe(true);
  });

  it("hides the tick-box from ordinary members entirely", () => {
    // Migration 0012: ordinary members see nothing, not even themselves.
    expect(
      canRecordAttendance({ appRole: "member", isEventPic: false, leadsAnyCross: false })
    ).toBe(false);
  });

  it("hides it when there is no signed-in profile", () => {
    expect(
      canRecordAttendance({ appRole: null, isEventPic: false, leadsAnyCross: false })
    ).toBe(false);
  });
});

describe("getAttendanceByEvent", () => {
  it("returns [] in demo mode instead of fake ticks", async () => {
    // No Supabase env in tests, so this runs the demo path: an empty list
    // renders the guiding empty state, never invented attendance.
    await expect(getAttendanceByEvent("event-1")).resolves.toEqual([]);
  });
});
