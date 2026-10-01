"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Crosshair, Rows3 } from "lucide-react";
import type { Profile } from "@/lib/types";
import type { StewardRole } from "@/lib/validation";
import { STEWARD_ROLES } from "@/lib/validation";
import { isOverloaded } from "@/lib/fatigue";
import { slotStatus } from "@/lib/stewards";
import { AssignStewardForm } from "./AssignStewardForm";
import { StewardRemoveButton } from "./StewardRemoveButton";

export interface BoardSteward {
  id: string;
  profileId: string;
  role: string;
  status: string;
}

export interface BoardColumn {
  id: string;
  dayNum: string;
  monthShort: string;
  weekdayLabel: string;
  theme: string;
  eventLabel: string;
  isPast: boolean;
  stewards: BoardSteward[];
}

/** Ciri warna per minggu — kelas literal (Tailwind tak melihat string
 *  dinamis). Emas untuk minggu berjalan, sisanya berputar sage → rose →
 *  warning supaya kolom mudah dibedakan sekilas. */
const WEEK_STYLES = [
  { dot: "bg-accent", num: "text-accent", bar: "border-accent" },
  { dot: "bg-sage", num: "text-sage", bar: "border-sage" },
  { dot: "bg-rose", num: "text-rose", bar: "border-rose" },
  { dot: "bg-warning", num: "text-warning", bar: "border-warning" },
];

/** Tampilan awal: 4 kolom (2 lewat + 2 mendatang) — cukup untuk
 *  perbandingan, tidak menenggelamkan. */
const DEFAULT_PAST = 2;
const DEFAULT_UPCOMING = 2;

/**
 * Papan interaktif (client): semua-minggu ↔ fokus-banding.
 *
 * Mode fokus: pilih satu minggu → papan menyusut jadi [minggu lalu |
 * minggu itu]. Kanan penuh CRUD, kiri pembanding read-only — supaya
 * "minggu depan tidak sama semua dengan minggu lalu" kelihatan tanpa
 * harus ingat. Bukan larangan sama: rotasi dianjurkan, bukan diwajibkan.
 */
export function PenatalayanBoard({
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
  const [expanded, setExpanded] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const loadOf = (profileId: string) =>
    byId.get(profileId)?.serviceCount30d ?? 0;
  const nameOf = (profileId: string) =>
    byId.get(profileId)?.nickname ?? "—";

  const past = useMemo(() => columns.filter((c) => c.isPast), [columns]);
  const upcoming = useMemo(() => columns.filter((c) => !c.isPast), [columns]);

  const visible: BoardColumn[] = useMemo(() => {
    if (focusId) {
      const idx = columns.findIndex((c) => c.id === focusId);
      if (idx === -1) return columns;
      return columns.slice(Math.max(0, idx - 1), idx + 1);
    }
    if (expanded) return columns;
    return [...past.slice(-DEFAULT_PAST), ...upcoming.slice(0, DEFAULT_UPCOMING)];
  }, [columns, past, upcoming, expanded, focusId]);

  const fullIndexOf = (id: string) => columns.findIndex((c) => c.id === id);
  const viewKey = focusId ? `fokus-${focusId}` : expanded ? "semua" : "ringkas";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {focusId ? (
          <button
            type="button"
            onClick={() => setFocusId(null)}
            className="btn-outline text-xs px-3 py-1.5"
          >
            ← Semua minggu
          </button>
        ) : (
          columns.length > DEFAULT_PAST + DEFAULT_UPCOMING && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="btn-outline text-xs px-3 py-1.5"
            >
              {expanded
                ? "Ciutkan (4 minggu)"
                : `Lihat semua (${columns.length} minggu)`}
            </button>
          )
        )}
        {focusId && (
          <p className="text-xs text-ink-muted">
            Kiri = pembanding minggu lalu (baca saja). Tidak harus beda —
            tapi kalau sama semua, pertimbangkan rotasi.
          </p>
        )}
      </div>

      <div
        key={viewKey}
        className="board-enter overflow-x-auto rounded-2xl border border-line/40 bg-surface/60 backdrop-blur-xl shadow-sm"
      >
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 bg-surface p-4 text-left font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink-muted"
              >
                Peran
              </th>
              {visible.map((col) => {
                const w = WEEK_STYLES[fullIndexOf(col.id) % WEEK_STYLES.length];
                const focused = focusId === col.id;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    className={`min-w-44 border-t-2 p-4 text-left align-top ${w.bar} ${
                      col.isPast ? "opacity-70" : ""
                    } ${focused ? "bg-accent-wash/30" : ""}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${w.dot}`} aria-hidden="true" />
                    <Link
                      href={`/dashboard/gatherings/${col.id}`}
                      className="group mt-1 block rounded-xl transition-colors hover:bg-surface-2/60 p-1 -m-1"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className={`num font-serif text-2xl font-bold ${w.num}`}>
                          {col.dayNum}
                        </span>
                        <span className="font-mono text-xs font-bold uppercase text-accent">
                          {col.monthShort}
                        </span>
                        {col.isPast && (
                          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-faint">
                            · lewat
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-xs font-semibold text-ink">
                        {col.theme}
                      </span>
                      <span className="block text-[0.6875rem] text-ink-faint">
                        {col.weekdayLabel}
                      </span>
                    </Link>
                    {!col.isPast && !focusId && (
                      <button
                        type="button"
                        onClick={() => setFocusId(col.id)}
                        className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-line/40 px-2.5 text-xs text-ink-muted transition-colors hover:border-accent/60 hover:text-accent"
                      >
                        <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                        Fokus
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {STEWARD_ROLES.map((role: StewardRole) => (
              <tr key={role} className="border-t border-rule-soft/60">
                <th
                  scope="row"
                  className="sticky left-0 bg-surface p-4 text-left font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent"
                >
                  {role}
                </th>
                {visible.map((col) => {
                  const stewards = col.stewards.filter(
                    (s) => s.role === role && s.status !== "replaced"
                  );
                  const slot = slotStatus(role, stewards.length);
                  const readOnly = col.isPast || (focusId !== null && focusId !== col.id);
                  return (
                    <td key={col.id} className="p-3 align-top">
                      <p
                        className={`font-mono text-xs font-bold ${
                          slot.tone === "full" || slot.tone === "over"
                            ? "text-ink-muted"
                            : "text-accent"
                        }`}
                      >
                        {slot.head}
                      </p>
                      <p
                        className={`text-[0.6875rem] ${
                          slot.tone === "full" ? "text-sage" : "text-ink-faint"
                        }`}
                      >
                        {slot.sub}
                      </p>
                      {stewards.length === 0 ? (
                        <p className="mt-2 text-xs text-ink-faint">
                          Belum ada penatalayan
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {stewards.map((s) => {
                            const hot = isOverloaded(loadOf(s.profileId));
                            return (
                              <li
                                key={s.id}
                                title={`${nameOf(s.profileId)} — ${loadOf(s.profileId)}× dalam 30 hari`}
                                className={`flex items-center justify-between gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
                                  hot
                                    ? "border-danger/50 bg-danger-wash/60 font-semibold text-danger"
                                    : "border-line/40 bg-canvas-sunk/60 text-ink"
                                }`}
                              >
                                <span className="min-w-0 flex-1 truncate">
                                  {nameOf(s.profileId)}
                                </span>
                                <span className="num shrink-0 font-mono font-bold opacity-80">
                                  {loadOf(s.profileId)}&times;
                                </span>
                                {canManage && !readOnly && (
                                  <StewardRemoveButton
                                    assignmentId={s.id}
                                    eventId={col.id}
                                    name={nameOf(s.profileId)}
                                    role={role}
                                  />
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {canManage && !readOnly && (
                        <div className="mt-2">
                          <AssignStewardForm
                            eventId={col.id}
                            eventLabel={col.weekdayLabel}
                            profiles={profiles}
                            crossNames={crossNames}
                            presetRole={role}
                            buttonLabel="Tambah"
                            compact
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <Rows3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Merah = sudah &gt;2&times; dalam 30 hari — pertimbangkan orang lain
          dulu. Kolom “lewat” = riwayat (tidak bisa diubah dari sini). Klik
          tanggal untuk buka detail (ubah, arsip, absensi).
        </span>
      </p>
    </div>
  );
}
