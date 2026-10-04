"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { claimCrossLeadership } from "@/app/actions/cross";
import type { Cross } from "@/lib/types";

/**
 * First-login self-claim card: a group the signed-in leader can claim with
 * the committee's code. Same card as the rest of the dashboard.
 */
export function ClaimCrossCard({ cross }: { cross: Cross }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await claimCrossLeadership(cross.id, code);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Gagal mengklaim kelompok.");
      }
    });
  }

  return (
    <li className="rounded-xl border border-line/60 bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-serif text-lg font-normal text-ink">
          {cross.name}
        </span>
        <span className="lp-meta">{cross.meetingDay}</span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
        {cross.description}
      </p>

      {!codeOpen ? (
        <button
          type="button"
          onClick={() => setCodeOpen(true)}
          className="btn-outline mt-4 text-xs font-semibold"
        >
          <KeyRound className="h-3.5 w-3.5 mr-1" />
          Klaim Kelompok Ini
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 border-t border-rule-soft pt-3">
          <label
            htmlFor={`code-${cross.id}`}
            className="lp-meta font-semibold text-ink-muted"
          >
            Kode Akses Pemimpin (dari Pengurus)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                id={`code-${cross.id}`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Masukkan kode..."
                autoFocus
                className="min-h-[44px] w-full rounded-xl border border-rule bg-canvas-sunk py-2 pl-9 pr-3 text-[0.9375rem] text-ink transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={pending || !code.trim()}
              className="btn-primary min-h-[44px] shrink-0 text-xs sm:text-sm disabled:opacity-60"
            >
              {pending ? "Memverifikasi…" : "Klaim"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-danger mt-1">
              {error}
            </p>
          )}
        </form>
      )}
    </li>
  );
}
