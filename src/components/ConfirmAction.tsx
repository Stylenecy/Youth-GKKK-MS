"use client";

import { useState, useTransition } from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

/**
 * Destructive / critical action behind a confirmation dialog with Nocturne styling.
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
            ? "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-danger/40 bg-danger-wash/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-danger transition-colors hover:bg-danger-wash hover:border-danger"
            : "btn-outline text-xs sm:text-sm"
        }
      >
        {label}
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="KONFIRMASI TINDAKAN"
        title={title}
      >
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-wash/60 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted">{body}</p>
        </div>

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
            disabled={pending}
            className="min-h-[44px] rounded-xl bg-danger px-4 text-xs sm:text-sm font-semibold text-canvas transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}
