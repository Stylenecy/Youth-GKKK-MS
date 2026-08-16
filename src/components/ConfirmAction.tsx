"use client";

import { useState, useTransition } from "react";
import { Modal } from "./Modal";

/**
 * Destructive action behind a confirmation dialog.
 *
 * Nothing in this app deletes permanently, but archiving still removes an
 * event from the front page, so it deserves a deliberate second step rather
 * than a single mis-tap. Uses the same focus-trapped Modal as the forms, so
 * keyboard behaviour is identical everywhere.
 */
export function ConfirmAction({
  label,
  title,
  body,
  confirmLabel,
  onConfirm,
  variant = "danger",
}: {
  label: string;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  variant?: "danger" | "outline";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error ?? "Gagal menyimpan perubahan.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          variant === "danger"
            ? "min-h-[44px] rounded-md border border-danger px-3.5 text-sm font-medium text-danger transition-colors hover:bg-danger-wash"
            : "btn-outline text-sm"
        }
      >
        {label}
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="Konfirmasi"
        title={title}
      >
        <p className="text-sm leading-relaxed text-ink-muted">{body}</p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-danger-wash px-3 py-2.5 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn-outline text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="min-h-[44px] rounded-md bg-danger px-4 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}
