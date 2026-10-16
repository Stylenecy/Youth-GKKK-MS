import { daysUntil } from "./datetime";
import type { EventStatus } from "./types";

/**
 * One label for an event's state, derived from BOTH its stored status and its
 * date.
 *
 * Before this existed, pages rendered `EVENT_STATUS[event.status]` and
 * `countdownLabel(event.date)` side by side from two independent sources of
 * truth. A gathering added for a date that had already passed kept the form's
 * default `status: "draft"`, so it showed the badge "Rencana" while the line
 * underneath it said "Sudah lewat" — both technically correct, together
 * nonsense.
 *
 * The date wins whenever it has already passed: nothing in the past is a plan.
 * `completed` and `archived` are explicit human decisions, so they outrank the
 * clock.
 */
export function eventStateLabel(event: {
  status: EventStatus;
  date: string;
}): { label: string; cls: string } {
  if (event.status === "archived") {
    return { label: "Arsip", cls: "tag font-medium opacity-60" };
  }
  if (event.status === "completed") {
    return { label: "Selesai", cls: "tag font-medium opacity-80" };
  }

  if (daysUntil(event.date) < 0) {
    return { label: "Telah berlangsung", cls: "tag font-medium opacity-80" };
  }

  return event.status === "published"
    ? { label: "Terjadwal", cls: "tag tag-sage font-medium" }
    : { label: "Rencana", cls: "tag font-medium" };
}

/**
 * Archived gatherings are withdrawn ones (cancelled, entered by mistake).
 * They stay readable in the history list, but nothing that plans ahead —
 * the steward board, "upcoming" counts, this month's statistics — may treat
 * them as a gathering that is going to happen.
 */
export function isLiveEvent(event: { status: EventStatus }): boolean {
  return event.status !== "archived";
}

/**
 * Splits gatherings for the schedule page: upcoming = not archived and not
 * yet started, soonest first; everything else (held, or archived whatever
 * its date) is history, newest first.
 */
export function splitGatherings<T extends { status: EventStatus; date: string }>(
  events: T[],
  now: number
): { upcoming: T[]; past: T[] } {
  const time = (e: T) => new Date(e.date).getTime();
  const upcoming = events
    .filter((e) => isLiveEvent(e) && time(e) >= now)
    .sort((a, b) => time(a) - time(b));
  const past = events
    .filter((e) => !(isLiveEvent(e) && time(e) >= now))
    .sort((a, b) => time(b) - time(a));
  return { upcoming, past };
}

/** 23:59:59.999 WIB on the calendar day (in WIB) of the given instant. */
function endOfWibDay(iso: string): number {
  const ymd = new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  return new Date(`${ymd}T23:59:59.999+07:00`).getTime();
}

/**
 * Why a gathering can no longer take new stewards, or null if it can.
 *
 * Open until the end of the gathering's own day (WIB), not just until it
 * starts: a stand-in who serves at 17.00 because someone fell ill is still
 * recorded that evening. The detail page hides "Tambah" with this same rule
 * (the board, a planning view, already closes a column once it starts);
 * this is also the server's copy, so a stale tab or a forged call cannot
 * staff a withdrawn or finished gathering.
 */
export function staffingBlock(
  event: { status: EventStatus; date: string },
  now: number
): string | null {
  if (!isLiveEvent(event)) {
    return "Ibadah ini sudah diarsipkan. Pulihkan dulu sebelum menugaskan penatalayan.";
  }
  if (endOfWibDay(event.date) < now) {
    return "Hari ibadah ini sudah lewat. Penugasan baru hanya untuk hari ini atau ibadah yang akan datang.";
  }
  return null;
}
