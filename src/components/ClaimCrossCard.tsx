"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { claimCrossLeadership } from "@/app/actions/cross";
import type { Cross } from "@/lib/types";

/**
 * First-login self-claim. Nobody pre-wires accounts by hand — each leader
 * picks their own group and enters the shared code Dex gives them,
 * whether that's one person during a small pilot or all eight once it's
 * rolled out to everyone. The code is checked in Postgres, inside
 * claim_cross_leadership() (migration 0004) — not just in this form.
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
    <li className="card-surface p-5">
      <span className="font-serif text-lg font-semibold text-ink">
        {cross.name}
      </span>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        {cross.description}
      </p>

      {!codeOpen ? (
        <button
          type="button"
          onClick={() => setCodeOpen(true)}
          className="btn-outline mt-4 text-sm"
        >
          Ini kelompokku
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
          <label
            htmlFor={`code-${cross.id}`}
            className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted"
          >
            Kode akses dari pengurus
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
                autoFocus
                className="min-h-[44px] w-full rounded-md border border-rule bg-surface py-2 pl-9 pr-3 text-[0.9375rem] text-ink transition-colors focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={pending || !code.trim()}
              className="btn-primary min-h-[44px] shrink-0 text-sm disabled:opacity-60"
            >
              {pending ? "…" : "Klaim"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </li>
  );
}
