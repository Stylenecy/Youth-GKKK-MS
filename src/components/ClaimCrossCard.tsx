"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { claimCrossLeadership } from "@/app/actions/cross";
import type { Cross } from "@/lib/types";

/**
 * First-login self-claim card with Nocturne luxury aesthetics.
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
    <li className="relative overflow-hidden rounded-2xl border border-line/40 bg-surface/75 p-5 backdrop-blur-xl transition-all duration-300 hover:border-line-accent">
      <div className="flex items-center justify-between">
        <span className="font-serif text-lg font-bold text-ink">
          {cross.name}
        </span>
        <span className="font-mono text-xs text-accent">
          {cross.meetingDay}
        </span>
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
            className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-accent"
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
              className="btn-primary min-h-[44px] shrink-0 text-xs sm:text-sm shadow-sm disabled:opacity-60"
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
