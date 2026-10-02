"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Modal } from "./Modal";
import { removeStewardAssignment } from "@/app/actions/gatherings";

/**
 * Tombol × di chip penatalayan (Papan, komite saja).
 *
 * Jalan keluar permanen untuk salah pilih — melengkapi toast "Batalkan"
 * yang hanya hidup detik sesudah menambah. Butuh migrasi 0014; tanpa itu
 * RLS menolak dengan pesan ramah (gagal tertutup, bukan bocor).
 */
export function StewardRemoveButton({
  assignmentId,
  eventId,
  name,
  role,
}: {
  assignmentId: string;
  eventId: string;
  name: string;
  role: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await removeStewardAssignment(assignmentId, eventId);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Gagal menghapus penugasan.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        aria-label={`Hapus ${name} dari ${role}`}
        title={`Hapus ${name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger-wash hover:text-danger"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="PENATALAYAN"
        title="Hapus penugasan ini?"
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          <strong className="text-ink">{name}</strong> tidak lagi tercatat
          sebagai {role} di ibadah ini.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-danger/40 bg-danger-wash p-3 text-xs text-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-rule-soft pt-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn-outline text-xs sm:text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="min-h-[44px] rounded-xl bg-danger px-4 text-xs sm:text-sm font-semibold text-canvas transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Menghapus…" : "Hapus"}
          </button>
        </div>
      </Modal>
    </>
  );
}
