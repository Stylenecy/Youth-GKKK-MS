"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { addCrossMember } from "@/app/actions/cross";
import { validateMemberName } from "@/lib/validation";

/**
 * Name-only, inline, one row. Built for someone standing up mid-Cross
 * typing on a phone — no modal to open, no required fields beyond the
 * name, Enter submits and refocuses so the next name can go straight in.
 *
 * `existingNames` powers a soft duplicate warning: a second tap of Tambah
 * confirms it. It is a UX nicety against typos, not a uniqueness rule —
 * two real people can legitimately share a nickname, so this never
 * blocks the submit outright.
 */
export function QuickAddMemberForm({
  crossId,
  existingNames = [],
}: {
  crossId: string;
  existingNames?: string[];
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [confirmingDuplicate, setConfirmingDuplicate] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const existingLower = useMemo(
    () => new Set(existingNames.map((n) => n.toLowerCase())),
    [existingNames]
  );

  function submit(trimmed: string) {
    setError(null);
    startTransition(async () => {
      const result = await addCrossMember(crossId, trimmed);
      if (result.success) {
        setJustAdded(trimmed);
        setName("");
        setConfirmingDuplicate(false);
        router.refresh();
        setTimeout(() => setJustAdded(null), 2500);
        inputRef.current?.focus();
      } else {
        setError(result.error ?? "Gagal menambah anggota.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validated = validateMemberName(name);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    if (!confirmingDuplicate && existingLower.has(validated.value.toLowerCase())) {
      setError(null);
      setConfirmingDuplicate(true);
      return;
    }

    submit(validated.value);
  }

  function handleChange(value: string) {
    setName(value);
    if (confirmingDuplicate) setConfirmingDuplicate(false);
    if (error) setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Nama anggota baru"
          aria-label="Nama anggota baru"
          maxLength={80}
          className="min-h-[44px] flex-1 rounded-md border border-rule bg-surface px-3 py-2 text-[0.9375rem] text-ink transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="btn-primary min-h-[44px] shrink-0 px-4 text-sm disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">
            {confirmingDuplicate ? "Yakin, tambah" : "Tambah"}
          </span>
        </button>
      </div>

      <div aria-live="polite" className="min-h-[1.25rem] text-sm">
        {error && <span className="text-danger">{error}</span>}
        {!error && confirmingDuplicate && (
          <span className="text-warning">
            Sudah ada anggota bernama itu. Tap &ldquo;Yakin, tambah&rdquo; kalau
            memang orang berbeda.
          </span>
        )}
        {!error && !confirmingDuplicate && justAdded && (
          <span className="text-sage">
            &ldquo;{justAdded}&rdquo; ditambahkan. Ketik nama berikutnya.
          </span>
        )}
      </div>
    </form>
  );
}
