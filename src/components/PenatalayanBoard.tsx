"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Crosshair, Rows3 } from "lucide-react";
import type { Profile } from "@/lib/types";
import type { StewardRole } from "@/lib/validation";
import { STEWARD_ROLES } from "@/lib/validation";
import { isOverloaded } from "@/lib/fatigue";
import { slotStatus, SLOT_NEEDS } from "@/lib/stewards";
import { AssignStewardForm } from "./AssignStewardForm";
import { StewardRemoveButton } from "./StewardRemoveButton";
import { PenatalayanPhone } from "./PenatalayanPhone";

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

/** Satu aksen saja (AGENT.md: tanpa rona per bagian): emas hanya untuk
 *  Sabtu berikutnya, kolom lain netral. Kelas literal supaya Tailwind
 *  melihatnya. */
const WEEK_NEXT = { dot: "bg-accent", num: "text-accent", bar: "border-accent" };
const WEEK_OTHER = { dot: "bg-ink-faint", num: "text-ink", bar: "border-line" };

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

  const nextId = upcoming[0]?.id;
  const viewKey = focusId ? `fokus-${focusId}` : expanded ? "semua" : "ringkas";

  return (
    <div>
      {/* Phone/tablet: one Saturday per screen. */}
      <div className="lg:hidden">
        <PenatalayanPhone
          columns={columns}
          profiles={profiles}
          crossNames={crossNames}
          canManage={canManage}
        />
      </div>

      {/* Desktop: the Peran × Sabtu grid, mirroring the team's spreadsheet. */}
      <div className="hidden lg:block">
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
        role="region"
        aria-label="Papan penatalayan: peran per Sabtu"
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-line/50 bg-surface"
      >
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="lp-meta sticky left-0 bg-surface p-4 text-left font-semibold text-ink-muted"
              >
                Peran
              </th>
              {visible.map((col) => {
                const w = col.id === nextId ? WEEK_NEXT : WEEK_OTHER;
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
                        <span className={`lp-num text-2xl ${w.num}`}>{col.dayNum}</span>
                        <span className="lp-meta">{col.monthShort}</span>
                        {col.isPast && <span className="lp-meta">· lewat</span>}
                      </span>
                      <span className="mt-1 block truncate text-xs font-semibold text-ink">
                        {col.theme}
                      </span>
                      <span className="block text-[0.6875rem] text-ink-muted">
                        {col.weekdayLabel}
                      </span>
                    </Link>
                    {!col.isPast && !focusId && (
                      <button
                        type="button"
                        onClick={() => setFocusId(col.id)}
                        className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line/40 px-2.5 text-xs text-ink-muted transition-colors hover:border-accent/60 hover:text-accent"
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
                  className="sticky left-0 bg-surface px-4 pt-3 pb-4 text-left align-top font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink"
                >
                  {role}
                </th>
                {visible.map((col) => {
                  const stewards = col.stewards.filter(
                    (s) => s.role === role && s.status !== "replaced"
                  );
                  const slot = slotStatus(role, stewards.length);
                  const readOnly = col.isPast || (focusId !== null && focusId !== col.id);
                  // Same rule as the phone roster: offer "Tambah" only where a
                  // slot is short, plus Pemusik (no upper limit). A full cell
                  // with a button reads as "something to do" when nothing is.
                  const canAdd =
                    slot.tone === "empty" ||
                    slot.tone === "partial" ||
                    SLOT_NEEDS[role].max === null ||
                    stewards.some((s) => s.status === "change_requested");
                  return (
                    <td key={col.id} className="p-3 align-top">
                      <p
                        className={`font-mono text-xs font-bold ${
                          slot.tone === "full" || slot.tone === "over"
                            ? "text-ink-muted"
                            : "text-warning"
                        }`}
                      >
                        {slot.head}
                      </p>
                      <p
                        className={`text-[0.6875rem] ${
                          slot.tone === "full" ? "text-sage" : "text-ink-muted"
                        }`}
                      >
                        {slot.sub}
                      </p>
                      {stewards.length === 0 ? (
                        <p className="mt-2 text-xs text-ink-muted">
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
                                className={`flex items-center justify-between gap-1 rounded-lg border bg-canvas-sunk/60 px-2.5 py-1.5 text-xs text-ink ${
                                  hot ? "border-warning/60" : "border-line/40"
                                }`}
                              >
                                <span className="min-w-0 flex-1 truncate">
                                  {nameOf(s.profileId)}
                                </span>
                                <span
                                  className={`num inline-flex shrink-0 items-center gap-1 font-mono ${
                                    hot ? "font-semibold text-warning" : "text-ink-muted"
                                  }`}
                                >
                                  {loadOf(s.profileId)}&times;
                                  {hot && (
                                    <>
                                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                      <span className="sr-only">beban tinggi</span>
                                    </>
                                  )}
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
                      {canManage && !readOnly && canAdd && (
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
          Tanda peringatan = sudah &gt;2&times; dalam 30 hari — pertimbangkan
          orang lain dulu. Kolom “lewat” = riwayat (tidak bisa diubah dari sini). Klik
          tanggal untuk buka detail (ubah, arsip, absensi).
        </span>
      </p>
      </div>
    </div>
  );
}
