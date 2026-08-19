"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check, AlertCircle } from "lucide-react";
import { addCrossMember } from "@/app/actions/cross";
import { validateMemberName } from "@/lib/validation";

/**
 * Name-only, inline, high-speed input for phone/desktop.
 * Enter submits and refocuses immediately for the next name.
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
        setTimeout(() => setJustAdded(null), 3000);
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
          placeholder="Ketik nama panggilan anggota..."
          aria-label="Nama anggota baru"
          maxLength={80}
          className="min-h-[44px] flex-1 rounded-xl border border-rule bg-canvas-sunk px-3.5 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-faint transition-all duration-200 focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="btn-primary min-h-[44px] shrink-0 px-4 text-xs sm:text-sm shadow-sm disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>
            {confirmingDuplicate ? "Yakin, Tambah" : "Tambah"}
          </span>
        </button>
      </div>

      <div aria-live="polite" className="min-h-[1.5rem] text-xs">
        {error && (
          <span className="flex items-center gap-1.5 font-medium text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </span>
        )}
        {!error && confirmingDuplicate && (
          <span className="flex items-center gap-1.5 font-medium text-warning">
            <AlertCircle className="h-3.5 w-3.5" />
            Sudah ada anggota bernama &quot;{name}&quot;. Tekan &ldquo;Yakin, Tambah&rdquo; jika memang orang berbeda.
          </span>
        )}
        {!error && !confirmingDuplicate && justAdded && (
          <span className="flex items-center gap-1.5 font-semibold text-sage">
            <Check className="h-3.5 w-3.5" />
            &ldquo;{justAdded}&rdquo; berhasil ditambahkan ke kelompok.
          </span>
        )}
      </div>
    </form>
  );
}
