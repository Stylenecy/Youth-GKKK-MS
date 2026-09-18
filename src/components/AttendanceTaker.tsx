"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Search } from "lucide-react";
import { markAttendance } from "@/app/actions/attendance";

export interface AttendanceMember {
  id: string;
  nickname: string;
  fullName: string;
}

/**
 * Phone-first attendance tick-box for one gathering.
 *
 * Every toggle writes through mark_attendance() (migration 0012), which
 * re-checks the caller's right to record that exact person in SQL — so a
 * stale page or a forged request can never plant a verdict. Ticks are
 * optimistic for speed and revert when the database refuses the write.
 */
export function AttendanceTaker({
  eventId,
  members,
  initialPresent,
}: {
  eventId: string;
  members: AttendanceMember[];
  initialPresent: string[];
}) {
  const [present, setPresent] = useState<Set<string>>(
    () => new Set(initialPresent)
  );
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const sorted = [...members].sort((a, b) =>
      a.nickname.localeCompare(b.nickname, "id")
    );
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.nickname.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q)
    );
  }, [members, filter]);

  function toggle(memberId: string, next: boolean) {
    setFailed(null);
    setPresent((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(memberId);
      else updated.delete(memberId);
      return updated;
    });
    setBusyIds((prev) => new Set(prev).add(memberId));
    startTransition(async () => {
      const result = await markAttendance(eventId, memberId, next);
      setBusyIds((prev) => {
        const updated = new Set(prev);
        updated.delete(memberId);
        return updated;
      });
      if (!result.success) {
        // The database refused the write (e.g. rights changed mid-session)
        // — take the optimistic tick back and say so.
        setPresent((prev) => {
          const updated = new Set(prev);
          if (next) updated.delete(memberId);
          else updated.add(memberId);
          return updated;
        });
        setFailed(result.error ?? "Gagal mencatat kehadiran.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-ink-faint" aria-live="polite">
          {present.size} dari {members.length} hadir
        </p>
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Cari nama anggota</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cari nama…"
            className="w-full rounded-xl border border-line bg-canvas-sunk/60 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-line-accent focus:outline-none"
          />
        </label>
      </div>

      {failed && (
        <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-danger">
          <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
          {failed}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          Tidak ada nama yang cocok dengan pencarian.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule-soft/60">
          {visible.map((m) => {
            const checked = present.has(m.id);
            const busy = busyIds.has(m.id);
            return (
              <li key={m.id}>
                <label
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2/40 ${
                    busy ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={(e) => toggle(m.id, e.target.checked)}
                    className="h-5 w-5 shrink-0 accent-[#FDBE02]"
                    aria-label={`Tandai ${m.nickname} hadir`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-base font-bold text-ink">
                      {m.nickname}
                    </span>
                    {m.fullName !== m.nickname && (
                      <span className="block truncate text-xs text-ink-muted">
                        {m.fullName}
                      </span>
                    )}
                  </span>
                  {busy && (
                    <span className="ml-auto font-mono text-[0.6875rem] uppercase tracking-wider text-ink-faint">
                      menyimpan…
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
