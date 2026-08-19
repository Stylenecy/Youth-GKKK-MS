import { describe, it, expect } from "vitest";
import { eventStateLabel } from "../src/lib/events";

const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString();

describe("eventStateLabel", () => {
  it("does not call a past date a plan", () => {
    // The bug this guards: a gathering added for a date that had already
    // passed kept the form's default status "draft" and rendered the badge
    // "Rencana" next to the line "Sudah lewat".
    const label = eventStateLabel({ status: "draft", date: daysFromNow(-9) });
    expect(label.label).toBe("Telah berlangsung");
  });

  it("does not call a past published event upcoming either", () => {
    const label = eventStateLabel({ status: "published", date: daysFromNow(-2) });
    expect(label.label).toBe("Telah berlangsung");
  });

  it("labels a future published event as scheduled", () => {
    expect(eventStateLabel({ status: "published", date: daysFromNow(3) }).label)
      .toBe("Terjadwal");
  });

  it("labels a future draft as a plan", () => {
    expect(eventStateLabel({ status: "draft", date: daysFromNow(3) }).label)
      .toBe("Rencana");
  });

  it("treats today as not yet past", () => {
    // An event at 17:00 today is still ahead of a 09:00 viewer, and calling it
    // "Telah berlangsung" all day would be wrong for most of that day.
    expect(eventStateLabel({ status: "published", date: daysFromNow(0) }).label)
      .toBe("Terjadwal");
  });

  it("lets an explicit human decision outrank the clock", () => {
    // Someone archiving or completing an event said something deliberate;
    // a future date must not override that.
    expect(eventStateLabel({ status: "archived", date: daysFromNow(5) }).label)
      .toBe("Arsip");
    expect(eventStateLabel({ status: "completed", date: daysFromNow(5) }).label)
      .toBe("Selesai");
    expect(eventStateLabel({ status: "archived", date: daysFromNow(-5) }).label)
      .toBe("Arsip");
  });

  it("always returns a usable css class", () => {
    for (const status of ["draft", "published", "completed", "archived"] as const) {
      for (const offset of [-5, 0, 5]) {
        const { cls, label } = eventStateLabel({ status, date: daysFromNow(offset) });
        expect(cls).toContain("tag");
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });
});
