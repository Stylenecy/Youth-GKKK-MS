"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, TriangleAlert, Check, Plus } from "lucide-react";
import { assignSteward, removeStewardAssignment } from "@/app/actions/gatherings";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";
import { STEWARD_ROLES, type StewardRole } from "@/lib/validation";
import {
  groupStewardCandidates,
  type StewardCandidate,
} from "@/lib/stewards";
import { isOverloaded } from "@/lib/fatigue";
import { MEMBER_STATUS_DOT } from "@/lib/members";
import {
  EMPTY_FILL,
  currentSlot,
  fillDone,
  fillSaved,
  fillSkipped,
  fillUndone,
  startFill,
  type FillState,
} from "@/lib/fill-queue";
import type { MemberStatus } from "@/lib/types";
import { Modal, Field, fieldClass } from "./Modal";
import { callAction } from "@/lib/call-action";
import { DEMO_NOTE, demoNote } from "@/lib/demo";

export interface AssignedToast {
  assignmentId: string | null;
  name: string;
  role: string;
}

/**
 * Assign steward — masukan Nathan via Dex, 18 Okt 2026.
 *
 * - Siapa pun yang sudah bertugas di ibadah ini tidak bisa dipilih lagi
 *   (satu orang satu peran per hari; migrasi 0025 menjaga di database).
 * - Kandidat dikelompokkan: "Pernah jadi <peran>" dulu, lalu anggota aktif
 *   lain — keduanya urut abjad. Beban 30 hari tetap tampil, yang terlalu
 *   sering ditandai (tidak diblokir — koordinator memegang keputusan).
 * - `queue` = mode "Isi berurutan" (HP): satu lembar berjalan dari slot
 *   kosong satu ke berikutnya tanpa ditutup.
 */
export function AssignStewardForm({
  eventId,
  eventLabel,
  profiles,
  crossNames,
  serving = [],
  presetRole,
  queue,
  buttonLabel,
  compact = false,
  variant = "outline",
  hideTrigger = false,
}: {
  eventId: string;
  eventLabel: string;
  profiles: Profile[];
  crossNames: Record<string, string[]>;
  /** Who already serves at this event (replaced rows excluded). */
  serving?: { profileId: string; role: string }[];
  presetRole?: StewardRole;
  /** Isi berurutan: the empty slots of this Saturday, one entry per slot. */
  queue?: StewardRole[];
  buttonLabel?: string;
  compact?: boolean;
  /** dashed = empty slot in a roster; primary = the one gold action;
   *  plus = the compact round "+" in a roster's action column. */
  variant?: "outline" | "dashed" | "primary" | "plus";
  /** Keep the form (and its open sheet / undo box) mounted but hide the
   *  button — e.g. a role that just became full, or a Saturday whose last
   *  empty slot was just filled from this sheet. */
  hideTrigger?: boolean;
}) {
  // Frozen when the sheet opens: the refresh after the last save empties
  // `queue`, and that must not turn an open "Isi berurutan" sheet back into
  // the single-role form.
  const [chain, setChain] = useState(false);
  const [chainAnnounce, setChainAnnounce] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<StewardRole | "">(presetRole ?? "");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<AssignedToast | null>(null);
  const [undoState, setUndoState] = useState<"idle" | "working" | "failed" | "done">("idle");
  // Isi berurutan: a local copy of the queue (undo can put a slot back),
  // the current position, and what this sheet already saved — pure rules
  // in lib/fill-queue.ts.
  const [fill, setFill] = useState<FillState>(EMPTY_FILL);
  const saved = fill.saved;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const chainDone = chain && fillDone(fill);
  const effectiveRole: StewardRole | "" = chain
    ? (currentSlot(fill) ?? "")
    : (presetRole ?? role);

  const candidates: StewardCandidate[] = useMemo(
    () =>
      profiles.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        fullName: p.fullName,
        status: p.status,
        load: p.serviceCount30d ?? null,
        crossLabel: crossNames[p.id]?.join(", ") || "—",
        rolesServed: p.rolesServed,
      })),
    [profiles, crossNames]
  );
  const nameOf = useMemo(() => {
    const byId = new Map(profiles.map((p) => [p.id, p.nickname]));
    return (id: string) => byId.get(id) ?? "—";
  }, [profiles]);

  // Already serving = the server's list + what this sheet just saved (the
  // refresh that brings them into `serving` may still be on its way).
  const servingNow = useMemo(() => {
    const list = serving.map((s) => ({ profileId: s.profileId, role: s.role }));
    for (const s of saved) {
      if (!list.some((x) => x.profileId === s.profileId)) {
        list.push({ profileId: s.profileId, role: s.role });
      }
    }
    return list;
  }, [serving, saved]);
  const servingIds = useMemo(
    () => new Set(servingNow.map((s) => s.profileId)),
    [servingNow]
  );

  const groups = useMemo(
    () =>
      effectiveRole
        ? groupStewardCandidates(candidates, query, effectiveRole, servingIds)
        : { sections: [], hiddenUnavailable: 0 },
    [candidates, query, effectiveRole, servingIds]
  );
  const anyCandidate = groups.sections.some((s) => s.items.length > 0);

  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId]
  );
  const selectedOverloaded =
    selected !== null && selected.load !== null && isOverloaded(selected.load);
  const lastSaved = saved[saved.length - 1] ?? null;

  // Fresh form on every open — reset in the handler, not in an effect
  // (an effect would render once with stale values, then again).
  function open() {
    setQuery("");
    setSelectedId(null);
    setError(null);
    if (!presetRole) setRole("");
    const startChain = (queue?.length ?? 0) > 0;
    setChain(startChain);
    setChainAnnounce("");
    setFill(startChain ? startFill(queue ?? []) : EMPTY_FILL);
    setIsOpen(true);
  }

  // Keyboard users land in the search box; on a phone that would pop the
  // keyboard over the list, so touch screens start on the list instead.
  useEffect(() => {
    if (!isOpen) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const t = setTimeout(() => searchRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen, fill.pos]);

  function close() {
    setIsOpen(false);
  }

  function resetPick() {
    setQuery("");
    setSelectedId(null);
    setError(null);
    listRef.current?.scrollTo({ top: 0 });
  }

  function skipSlot() {
    resetPick();
    setFill(fillSkipped);
  }

  function handleSubmit() {
    if (!effectiveRole || !selectedId || !selected || isPending) return;
    const savedRole = effectiveRole;
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => assignSteward(eventId, selectedId, savedRole));
      if (result.success) {
        const name = selected.nickname;
        if (chain) {
          resetPick();
          setFill((f) =>
            fillSaved(f, { assignmentId: result.id ?? null, profileId: selected.id, name, role: savedRole })
          );
          setChainAnnounce(`${name} ditetapkan sebagai ${savedRole}.${demoNote()}`);
        } else {
          close();
          setToast({ assignmentId: result.id ?? null, name, role: savedRole });
          setUndoState("idle");
        }
        router.refresh();
      } else {
        setError(result.error ?? "Gagal menugaskan penatalayan.");
      }
    });
  }

  function handleUndo() {
    if (!toast?.assignmentId || undoState === "working") return;
    setUndoState("working");
    startTransition(async () => {
      const result = await callAction(() => removeStewardAssignment(toast.assignmentId as string, eventId));
      if (result.success) {
        setUndoState("done");
        router.refresh();
      } else {
        setUndoState("failed");
        setError(result.error ?? "Perubahan belum berhasil dibatalkan.");
      }
    });
  }

  /** Isi berurutan: undo the last save and put its slot back in front. */
  function undoLastInChain() {
    const last = saved[saved.length - 1];
    if (!last?.assignmentId || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await callAction(() =>
        removeStewardAssignment(last.assignmentId as string, eventId)
      );
      if (result.success) {
        setFill(fillUndone);
        setChainAnnounce("Perubahan dibatalkan.");
        setSelectedId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Perubahan belum berhasil dibatalkan.");
      }
    });
  }

  const title = chain ? "Isi yang kurang" : presetRole ? "Tambah penatalayan" : "Tugaskan Tim Pelayanan";
  const searchId = `cari-${eventId}-${presetRole ?? (chain ? "urut" : "semua")}`;

  return (
    <>
      {/* One always-mounted live region (same pattern as Toast.tsx); the
          visible boxes below carry no role, so nothing is announced twice. */}
      <div role="status" aria-live="polite" className="sr-only">
        {chain && isOpen
          ? chainAnnounce
          : !toast
            ? ""
            : undoState === "done"
              ? "Perubahan dibatalkan."
              : `${toast.name} ditetapkan sebagai ${toast.role}.${demoNote()}`}
      </div>

      {!hideTrigger && (
        <button
          type="button"
          onClick={open}
          // Many identical bare "Tambah" buttons on the desktop board: name
          // each one. Labels that already say what they do keep their text as
          // the accessible name (WCAG 2.5.3).
          aria-label={
            presetRole && (variant === "plus" || (buttonLabel ?? "Tambah") === "Tambah")
              ? `Tambah ${presetRole} untuk ${eventLabel}`
              : undefined
          }
          className={
            variant === "plus"
              ? "flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-line text-ink-muted transition-colors hover:border-accent hover:text-accent"
              : variant === "primary"
              ? "btn-primary w-full justify-center text-sm"
              : variant === "dashed"
                ? "btn-outline w-full justify-center border-dashed text-sm"
                : compact
                  ? "btn-outline w-full justify-center text-xs px-2 py-1.5"
                  : "btn-outline text-xs sm:text-sm"
          }
          // .btn-* sets a solid border shorthand outside Tailwind's layers,
          // so the dashed "empty slot" look has to be inline.
          style={
            variant === "dashed"
              ? { borderStyle: "dashed", paddingInline: "0.75rem" }
              : undefined
          }
        >
          {variant === "plus" ? (
            <Plus className="h-5 w-5" aria-hidden="true" />
          ) : (
            <>
              {variant !== "dashed" && <UserPlus className="h-4 w-4" aria-hidden="true" />}
              {buttonLabel ?? "Tugaskan Penatalayan"}
            </>
          )}
        </button>
      )}

      <Modal open={isOpen} onClose={close} kicker="PENATALAYAN" title={title}>
        <p className="text-xs text-ink-muted">
          {eventLabel}
          {effectiveRole ? ` · ${effectiveRole}` : ""}
          {chain && !chainDone && (
            <span className="num font-mono">
              {" "}· slot {fill.pos + 1} dari {fill.slots.length}
            </span>
          )}
        </p>

        {chain && lastSaved && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-sage/40 bg-sage-wash/60 px-3 py-2 text-xs text-ink">
            <Check className="h-4 w-4 shrink-0 text-sage" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <strong>{lastSaved.name}</strong> → {lastSaved.role}
              {isSupabaseConfigured() ? (
                " tersimpan."
              ) : (
                <span className="text-ink-muted">{DEMO_NOTE}</span>
              )}
            </span>
            {lastSaved.assignmentId && (
              <button
                type="button"
                disabled={isPending}
                onClick={undoLastInChain}
                className="min-h-[44px] shrink-0 px-1 font-semibold underline underline-offset-2 disabled:opacity-60"
              >
                Batalkan
              </button>
            )}
          </div>
        )}

        {chainDone ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-xl border border-line/40 bg-canvas-sunk/60 px-3.5 py-3 text-sm text-ink">
              {!isSupabaseConfigured()
                ? "Selesai. Mode demo: tidak ada yang disimpan."
                : saved.length > 0
                  ? `Selesai — ${saved.length} slot terisi di lembar ini.`
                  : "Semua slot dilewati."}{" "}
              Tutup untuk melihat papan.
            </p>
            <button type="button" onClick={close} className="btn-primary w-full justify-center text-sm">
              Tutup
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!presetRole && !chain && (
              <Field name="role" label="Peran Pelayanan">
                <select
                  id="role"
                  name="role"
                  required
                  value={role}
                  disabled={isPending}
                  onChange={(e) => {
                    setRole(e.target.value as StewardRole | "");
                    setSelectedId(null);
                  }}
                  className={fieldClass}
                >
                  <option value="">Pilih peran…</option>
                  {STEWARD_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div>
              <label htmlFor={searchId} className="mb-1.5 block text-xs font-semibold text-ink">
                Penatalayan
              </label>
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={query}
                disabled={isPending || !effectiveRole}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={effectiveRole ? "Cari nama…" : "Pilih peran terlebih dahulu"}
                autoComplete="off"
                className={fieldClass}
              />
            </div>

            {servingNow.length > 0 && (
              <p className="text-xs leading-relaxed text-ink-muted">
                <span className="font-semibold text-ink">Sudah bertugas hari itu</span>{" "}
                (tidak bisa dipilih lagi):{" "}
                {servingNow.map((s) => `${nameOf(s.profileId)} (${s.role})`).join(" · ")}
              </p>
            )}

            {effectiveRole ? (
              !anyCandidate ? (
                <p className="rounded-xl border border-line/40 bg-canvas-sunk/60 px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
                  {query.trim()
                    ? `Tidak ada anggota aktif bernama “${query.trim()}” yang masih bebas hari itu.`
                    : "Tidak ada anggota aktif yang masih bebas hari itu."}
                </p>
              ) : (
                <div
                  ref={listRef}
                  className="max-h-[min(46dvh,26rem)] overflow-y-auto rounded-xl border border-line/40"
                >
                  {groups.sections.map((section) => (
                    <section key={section.key} aria-label={section.title}>
                      <h3 className="sticky top-0 z-10 border-b border-rule-soft bg-surface px-3 py-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                        {section.title}{" "}
                        <span className="num">{section.items.length}</span>
                      </h3>
                      <ul>
                        {section.items.map(({ cand, disabled, overloaded }) => {
                          const active = cand.id === selectedId;
                          return (
                            <li key={cand.id} className="border-b border-rule-soft last:border-b-0">
                              <button
                                type="button"
                                disabled={disabled || isPending}
                                onClick={() => setSelectedId(active ? null : cand.id)}
                                aria-pressed={active}
                                className={`flex min-h-[48px] w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                                  active
                                    ? "bg-accent-wash shadow-[inset_3px_0_0_var(--color-accent)]"
                                    : "hover:bg-canvas-sunk/60"
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2.5">
                                  {/* Same dot as the directory (MEMBER_STATUS_DOT). */}
                                  <span
                                    aria-hidden="true"
                                    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                                      (MEMBER_STATUS_DOT[cand.status as MemberStatus] ?? MEMBER_STATUS_DOT.inactive).dot
                                    }`}
                                  />
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm">
                                      <span className="font-semibold text-ink">{cand.nickname}</span>
                                      {cand.fullName !== cand.nickname && (
                                        <span className={`ml-1.5 text-xs ${active ? "text-ink-muted" : "text-ink-faint"}`}>
                                          {cand.fullName}
                                        </span>
                                      )}
                                    </span>
                                    {(disabled || cand.crossLabel !== "—") && (
                                      <span className="block truncate text-xs text-ink-muted">
                                        {disabled ? "Berhalangan / tidak aktif" : `Cross: ${cand.crossLabel}`}
                                      </span>
                                    )}
                                  </span>
                                </span>
                                <span
                                  className={`num flex shrink-0 items-center gap-1 font-mono text-xs font-bold ${
                                    overloaded ? "text-danger" : "text-ink-muted"
                                  }`}
                                >
                                  {cand.load === null ? "—" : `${cand.load}×`}
                                  {overloaded && <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
                                  <span className="sr-only">
                                    {" "}dalam 30 hari{overloaded ? " — cukup sering bertugas" : ""}
                                  </span>
                                  {active && <Check className="ml-0.5 h-4 w-4 text-accent" aria-hidden="true" />}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )
            ) : null}

            {effectiveRole && groups.hiddenUnavailable > 0 && (
              <p className="text-xs text-ink-faint">
                {groups.hiddenUnavailable} anggota berhalangan/tidak aktif disembunyikan — ketik namanya kalau perlu.
                Angka di kanan = tugas 30 hari terakhir; ⚠ = cukup sering bertugas.
              </p>
            )}

            {selected && selectedOverloaded && (
              <p
                role="alert"
                className="rounded-xl border border-danger/40 bg-danger-wash/60 px-3.5 py-2.5 text-xs leading-relaxed text-danger"
              >
                <TriangleAlert className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {selected.nickname} sudah bertugas {selected.load}× dalam 30 hari
                terakhir. Pastikan penugasan ini memang disengaja.
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-danger/40 bg-danger-wash px-3.5 py-2.5 text-xs text-danger"
              >
                {error}
                {!chain && undoState === "failed" && toast?.assignmentId && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="ml-2 font-semibold underline underline-offset-2"
                  >
                    Coba lagi
                  </button>
                )}
              </p>
            )}

            {/* Pinned to the bottom of the sheet: on a phone the list scrolls
                under it, so Simpan is always one tap away. */}
            <div className="sticky -bottom-6 z-20 -mx-6 flex gap-2.5 border-t border-rule-soft bg-surface px-6 pb-1 pt-3 sm:-bottom-7 sm:-mx-7 sm:px-7">
              {selected && selectedOverloaded ? (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setSelectedId(null);
                      searchRef.current?.focus();
                    }}
                    className="btn-outline flex-1 justify-center text-sm disabled:opacity-60"
                  >
                    Pilih orang lain
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSubmit}
                    className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                  >
                    {isPending ? "Menyimpan…" : "Tetap jadwalkan"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={chain ? skipSlot : close}
                    className="btn-outline flex-none justify-center px-4 text-sm disabled:opacity-60"
                  >
                    {chain ? "Lewati" : "Batal"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !effectiveRole || !selectedId}
                    onClick={handleSubmit}
                    className="btn-primary flex-1 justify-center whitespace-nowrap text-sm disabled:opacity-60"
                  >
                    {isPending ? "Menyimpan…" : chain ? "Simpan & lanjut" : "Simpan"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && undoState !== "done" && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-xl border border-line bg-surface p-4 shadow-2xl lg:bottom-8">
          <p className="text-sm text-ink">
            <strong>{toast.name}</strong> ditetapkan sebagai {toast.role}.
            {!isSupabaseConfigured() && (
              <span className="font-normal text-ink-muted">{DEMO_NOTE}</span>
            )}
          </p>
          <div className="mt-2.5 flex gap-2">
            {toast.assignmentId && undoState !== "failed" && (
              <button
                type="button"
                disabled={undoState === "working"}
                onClick={handleUndo}
                className="btn-outline flex-1 justify-center text-xs disabled:opacity-60"
              >
                {undoState === "working" ? "Membatalkan…" : "Batalkan"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="btn-outline flex-1 justify-center text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      {toast && undoState === "done" && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-xl border border-line bg-surface p-4 shadow-2xl lg:bottom-8">
          <p className="text-sm text-ink">Perubahan dibatalkan.</p>
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setToast(null)}
              className="btn-outline w-full justify-center text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
