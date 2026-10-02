"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, TriangleAlert } from "lucide-react";
import { assignSteward, removeStewardAssignment } from "@/app/actions/gatherings";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";
import { STEWARD_ROLES, type StewardRole } from "@/lib/validation";
import {
  sortStewardCandidates,
  type StewardCandidate,
} from "@/lib/stewards";
import { isOverloaded } from "@/lib/fatigue";
import { Modal, Field, fieldClass } from "./Modal";

export interface AssignedToast {
  assignmentId: string | null;
  name: string;
  role: string;
}

/**
 * Assign steward — rebuild IMK 29 Sep 2026.
 *
 * Keputusan TIDAK lagi buta: tiap kandidat membawa beban 30 hari + Cross,
 * diurut ringan-dulu, overload ditandai (tak pernah diblokir — koordinator
 * memegang keputusan akhir). Dari sel papan, tanggal + peran sudah terisi
 * (presetRole) sehingga Nita tak mengulang 3 pilihan.
 */
export function AssignStewardForm({
  eventId,
  eventLabel,
  profiles,
  crossNames,
  presetRole,
  buttonLabel,
  compact = false,
  variant = "outline",
}: {
  eventId: string;
  eventLabel: string;
  profiles: Profile[];
  crossNames: Record<string, string[]>;
  presetRole?: StewardRole;
  buttonLabel?: string;
  compact?: boolean;
  /** dashed = empty slot in a roster; primary = the one gold action. */
  variant?: "outline" | "dashed" | "primary";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<StewardRole | "">(presetRole ?? "");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<AssignedToast | null>(null);
  const [undoState, setUndoState] = useState<"idle" | "working" | "failed" | "done">("idle");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const effectiveRole = presetRole ?? (role as StewardRole | "");

  const candidates: StewardCandidate[] = useMemo(
    () =>
      profiles.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        fullName: p.fullName,
        status: p.status,
        load: p.serviceCount30d ?? null,
        crossLabel: crossNames[p.id]?.join(", ") || "—",
      })),
    [profiles, crossNames]
  );

  const ranked = useMemo(
    () => sortStewardCandidates(candidates, query),
    [candidates, query]
  );

  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId]
  );
  const selectedOverloaded =
    selected !== null &&
    selected.load !== null &&
    isOverloaded(selected.load);

  // Fresh form on every open — reset in the handler, not in an effect
  // (an effect would render once with stale values, then again).
  function open() {
    setQuery("");
    setSelectedId(null);
    setError(null);
    if (!presetRole) setRole("");
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => searchRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  function handleSubmit() {
    if (!effectiveRole || !selectedId || !selected || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await assignSteward(eventId, selectedId, effectiveRole);
      if (result.success) {
        const name = selected.fullName;
        close();
        setToast({
          assignmentId: result.id ?? null,
          name,
          role: effectiveRole,
        });
        setUndoState("idle");
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
      const result = await removeStewardAssignment(toast.assignmentId as string, eventId);
      if (result.success) {
        setUndoState("done");
        router.refresh();
      } else {
        setUndoState("failed");
        setError(result.error ?? "Perubahan belum berhasil dibatalkan.");
      }
    });
  }

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {toast && undoState !== "done"
          ? `${toast.name} ditetapkan sebagai ${toast.role}`
          : ""}
      </div>

      <button
        type="button"
        onClick={open}
        // Many identical bare "Tambah" buttons on the desktop board: name
        // each one. Labels that already say what they do keep their text as
        // the accessible name (WCAG 2.5.3).
        aria-label={
          presetRole && (buttonLabel ?? "Tambah") === "Tambah"
            ? `Tambah ${presetRole} untuk ${eventLabel}`
            : undefined
        }
        className={
          variant === "primary"
            ? "btn-primary w-full justify-center text-sm"
            : variant === "dashed"
              ? "btn-outline w-full justify-center border-dashed text-sm"
              : compact
                ? "btn-outline w-full justify-center text-xs px-2 py-1.5"
                : "btn-outline text-xs sm:text-sm"
        }
        // .btn-* sets a solid border shorthand outside Tailwind's layers,
        // so the dashed "empty slot" look has to be inline.
        style={variant === "dashed" ? { borderStyle: "dashed" } : undefined}
      >
        {/* The dashed empty-slot button sits in a narrow roster column on a
            360 px phone; its label already says the action, so no icon. */}
        {variant !== "dashed" && <UserPlus className="h-4 w-4" aria-hidden="true" />}
        {buttonLabel ?? "Tugaskan Penatalayan"}
      </button>

      <Modal
        open={isOpen}
        onClose={close}
        kicker="PENATALAYAN"
        title={presetRole ? "Tambah penatalayan" : "Tugaskan Tim Pelayanan"}
      >
        <p className="text-xs text-ink-muted">
          {eventLabel}
          {effectiveRole ? ` · ${effectiveRole}` : ""}
        </p>

        <div className="mt-4 space-y-4">
          {!presetRole && (
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
            <label
              htmlFor={`cari-${eventId}-${effectiveRole || "semua"}`}
              className="mb-1.5 block text-xs font-semibold text-ink"
            >
              Penatalayan
            </label>
            <input
              ref={searchRef}
              id={`cari-${eventId}-${effectiveRole || "semua"}`}
              type="search"
              value={query}
              disabled={isPending || !effectiveRole}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                effectiveRole ? "Cari nama…" : "Pilih peran terlebih dahulu"
              }
              autoComplete="off"
              className={fieldClass}
            />
          </div>

          {effectiveRole ? (
            ranked.length === 0 ? (
              <p className="rounded-xl border border-line/40 bg-canvas-sunk/60 px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
                {query.trim() ? (
                  <>
                    Tidak ada penatalayan aktif dengan nama “{query.trim()}”.
                    Periksa kembali nama yang dicari.
                  </>
                ) : (
                  "Tidak ada kandidat. Muat ulang halaman lalu coba lagi."
                )}
              </p>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-0.5" aria-label="Daftar kandidat">
                {ranked.map(({ cand, disabled, overloaded }) => {
                  const active = cand.id === selectedId;
                  return (
                    <li key={cand.id}>
                      <button
                        type="button"
                        disabled={disabled || isPending}
                        onClick={() =>
                          setSelectedId(active ? null : cand.id)
                        }
                        aria-pressed={active}
                        className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          active
                            ? "border-accent bg-accent-wash/50"
                            : "border-line/40 bg-surface/60 hover:border-accent/60"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {cand.fullName}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            Cross: {cand.crossLabel}
                            {disabled ? " · Sedang tidak tersedia" : ""}
                          </span>
                          {overloaded && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-danger">
                              <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              Cukup sering bertugas
                            </span>
                          )}
                        </span>
                        <span className="num shrink-0 font-mono text-xs font-bold text-ink-muted">
                          {cand.load === null ? "—" : `${cand.load}×`} / 30 hari
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}

          {selected && selectedOverloaded && (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger-wash/60 px-3.5 py-2.5 text-xs leading-relaxed text-danger"
            >
              <TriangleAlert className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {selected.fullName} sudah bertugas {selected.load}× dalam 30 hari
              terakhir. Pastikan penugasan ini memang disengaja.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger-wash px-3.5 py-2.5 text-xs text-danger"
            >
              {error}
              {undoState === "failed" && toast?.assignmentId && (
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

          <div className="flex gap-2.5">
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
                  onClick={close}
                  className="btn-outline flex-1 justify-center text-sm disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending || !effectiveRole || !selectedId}
                  onClick={handleSubmit}
                  className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                >
                  {isPending ? "Menyimpan…" : "Simpan penugasan"}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {toast && undoState !== "done" && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-line bg-surface p-4 shadow-2xl lg:bottom-8"
        >
          <p className="text-sm text-ink">
            <strong>{toast.name}</strong> ditetapkan sebagai {toast.role}.
            {!isSupabaseConfigured() && (
              <span className="text-ink-muted"> (mode demo — tidak tersimpan)</span>
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
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-line bg-surface p-4 shadow-2xl lg:bottom-8"
        >
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
