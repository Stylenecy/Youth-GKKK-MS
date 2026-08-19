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
