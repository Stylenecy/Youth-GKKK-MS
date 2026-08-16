import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatWeekdayDayMonth,
  formatDayNumber,
  toDateInputValue,
  toTimeInputValue,
  wibToISO,
  daysUntil,
  countdownLabel,
  formatRupiahCompact,
} from "@/lib/datetime";

// Vercel runs the server in UTC. Every one of these would pass locally in
// Asia/Jakarta and fail in production if a formatter forgot its timeZone —
// which is exactly the bug commit 8f4e91f was fixing.
describe("WIB pinning", () => {
  // 2026-08-08T10:00:00Z === Saturday 8 August 2026, 17:00 WIB.
  const saturdayService = "2026-08-08T10:00:00.000Z";

  it("renders the Saturday service at 17:00, not 10:00", () => {
    expect(formatTime(saturdayService)).toBe("17.00 WIB");
  });

  it("keeps a late-evening service on the correct WIB day", () => {
    // 2026-08-08T17:30:00Z is Sunday 00:30 in WIB.
    const lateNight = "2026-08-08T17:30:00.000Z";
    expect(formatWeekdayDayMonth(lateNight)).toContain("Minggu");
    expect(formatDayNumber(lateNight)).toBe("09");
  });

  it("does not roll a 17:00 WIB service back a day", () => {
    expect(formatWeekdayDayMonth(saturdayService)).toContain("Sabtu");
    expect(formatDayNumber(saturdayService)).toBe("08");
  });
});

describe("form input helpers", () => {
  const saturdayService = "2026-08-08T10:00:00.000Z";

  it("round-trips a service through date + time inputs unchanged", () => {
    const date = toDateInputValue(saturdayService);
    const time = toTimeInputValue(saturdayService);
    expect(date).toBe("2026-08-08");
    expect(time).toBe("17.00");
    expect(wibToISO(date, "17:00")).toBe(saturdayService);
  });

  it("reads a late-night instant back as the WIB calendar day", () => {
    // Sunday 00:30 WIB — the naive `.toISOString().slice(0,10)` gives the 8th.
    expect(toDateInputValue("2026-08-08T17:30:00.000Z")).toBe("2026-08-09");
  });

  it("defaults a bare date to the 17:00 WIB slot, never UTC midnight", () => {
    // UTC midnight would be 07:00 WIB — breakfast, not a youth service.
    expect(wibToISO("2026-08-08")).toBe("2026-08-08T10:00:00.000Z");
    expect(formatTime(wibToISO("2026-08-08"))).toBe("17.00 WIB");
  });

  it("ignores a malformed time rather than producing an invalid date", () => {
    expect(wibToISO("2026-08-08", "garbage")).toBe("2026-08-08T10:00:00.000Z");
  });
});

describe("countdown", () => {
  it("counts whole calendar days, so a service later today is 'Hari ini'", () => {
    const inEightHours = new Date(Date.now() + 8 * 3600_000).toISOString();
    // Only meaningful when 8h ahead is still the same WIB day.
    if (daysUntil(inEightHours) === 0) {
      expect(countdownLabel(inEightHours)).toBe("Hari ini");
    }
  });

  it("labels a past date as lewat", () => {
    const lastWeek = new Date(Date.now() - 7 * 86_400_000).toISOString();
    expect(countdownLabel(lastWeek)).toBe("Sudah lewat");
  });
});

describe("rupiah", () => {
  it("compacts to jt / rb without inventing precision", () => {
    expect(formatRupiahCompact(0)).toBe("Rp0");
    expect(formatRupiahCompact(250_000)).toBe("Rp250rb");
    expect(formatRupiahCompact(1_200_000)).toBe("Rp1,2jt");
    expect(formatRupiahCompact(-85_000)).toBe("-Rp85rb");
  });
});
