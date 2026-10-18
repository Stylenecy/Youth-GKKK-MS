"use client";

import { useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { serviceReadiness, missingSlots } from "@/lib/stewards";
import { Meter } from "./page-parts";
import { RoleRoster } from "./RoleRoster";
import { AssignStewardForm } from "./AssignStewardForm";
import type { BoardColumn } from "./PenatalayanBoard";

/**
 * The board on a phone: one Saturday per screen.
 *
 * A Peran × Sabtu grid needs ~560 px; at 360 px it turned into sideways
 * scrolling through cramped cells. Here the Saturday is picked with a
 * segmented control and shown as the same Peran · Petugas · Slot table
 * the detail page uses, with one gold action for what is still missing.
 * Desktop keeps the full grid (Dex, 28 Sep: cermin spreadsheet).
 */
export function PenatalayanPhone({
  columns,
  profiles,
  crossNames,
  canManage,
}: {
  columns: BoardColumn[];
  profiles: Profile[];
  crossNames: Record<string, string[]>;
  canManage: boolean;
}) {
  // Last past Saturday for comparison + the next three to plan.
  const past = columns.filter((c) => c.isPast).slice(-1);
  const upcoming = columns.filter((c) => !c.isPast).slice(0, 3);
  const segments = [...past, ...upcoming];
  const [selectedId, setSelectedId] = useState(
    (upcoming[0] ?? past[0] ?? columns[0])?.id ?? null
  );
  const col = segments.find((c) => c.id === selectedId) ?? segments[0];
  if (!col) return null;

  const ready = serviceReadiness(col.stewards);
  const queue = missingSlots(col.stewards);
  const serving = col.stewards
    .filter((s) => s.status !== "replaced")
    .map((s) => ({ profileId: s.profileId, role: s.role }));

  return (
    <div>
      <div
        role="group"
        aria-label="Pilih Sabtu"
        className="grid gap-1 rounded-xl border border-line/60 bg-canvas-sunk p-1"
        style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
      >
        {segments.map((c) => {
          const active = c.id === col.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedId(c.id)}
              className={`min-h-[44px] rounded-lg px-1 text-sm transition-colors ${
                active
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className="num block font-mono">
                {c.dayNum} {c.monthShort}
              </span>
              {c.isPast && <span className="block text-[0.6875rem]">lewat</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <Link
          href={`/dashboard/gatherings/${col.id}`}
          className="flex min-h-[44px] min-w-0 flex-col justify-center text-base font-semibold text-ink underline-offset-4 hover:underline"
        >
          <span className="block truncate">{col.theme}</span>
          <span className="lp-meta block font-normal">{col.weekdayLabel}</span>
        </Link>
        <span className="num shrink-0 font-mono text-sm text-ink-muted">
          {ready.filled}/{ready.needed} slot
        </span>
      </div>
      <div className="mt-2">
        <Meter value={ready.filled} max={ready.needed} label={`Slot terisi ${col.weekdayLabel}`} />
      </div>

      <div className="mt-4">
        <RoleRoster
          eventId={col.id}
          eventLabel={col.weekdayLabel}
          stewards={col.stewards}
          profiles={profiles}
          crossNames={crossNames}
          canManage={canManage}
          readOnly={col.isPast}
        />
      </div>

      {canManage && !col.isPast && queue.length > 0 && (
        <div className="mt-5">
          <AssignStewardForm
            // One form per Saturday. The sheet copies `queue` when it opens,
            // so the refresh after each save does not reset an open sheet.
            key={col.id}
            eventId={col.id}
            eventLabel={col.weekdayLabel}
            profiles={profiles}
            crossNames={crossNames}
            serving={serving}
            queue={queue}
            buttonLabel={`Isi ${queue.length} slot yang kurang`}
            variant="primary"
          />
          <p className="mt-2 text-xs text-ink-muted">
            Satu lembar berjalan dari {queue[0]} sampai slot kosong terakhir — pilih nama, Simpan &amp; lanjut, atau Lewati.
          </p>
        </div>
      )}
      {col.isPast && (
        <p className="mt-4 text-xs text-ink-muted">
          Sabtu yang sudah lewat hanya untuk dibandingkan — tidak bisa diubah dari sini.
        </p>
      )}
    </div>
  );
}
