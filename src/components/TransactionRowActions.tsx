"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateTransaction, deleteTransaction } from "@/app/actions/finance";
import type { FinanceTransaction } from "@/lib/types";
import { Modal, Field, fieldClass } from "./Modal";
import { formatRupiah } from "@/lib/datetime";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNT_LABEL } from "@/lib/finance";

type FieldErrors = Record<string, string[] | undefined>;

/**
 * Edit + delete for one cash-book row.
 *
 * Both live behind icon buttons with visible labels for screen readers, sized
 * to the 44px touch target the rest of the app uses. Delete is a soft delete —
 * see `deleteTransaction`.
 */
export function TransactionRowActions({
  transaction,
}: {
  transaction: FinanceTransaction;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await updateTransaction(transaction.id, formData);
      if (result.success) {
        setEditOpen(false);
      } else {
        setErrors((result.errors ?? {}) as FieldErrors);
      }
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (result.success) {
        setDeleteOpen(false);
      } else {
        setDeleteError(result.error ?? "Gagal menghapus transaksi.");
      }
    });
  }

  const iconBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-canvas-sunk hover:text-ink";

  return (
    <>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className={iconBtn}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Ubah transaksi {transaction.description}</span>
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className={iconBtn}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">
            Hapus transaksi {transaction.description}
          </span>
        </button>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        kicker="Keuangan"
        title="Ubah transaksi"
      >
        <form action={handleSubmit} className="space-y-4">
          <Field name="amount" label="Jumlah (Rp)" error={errors.amount?.[0]}>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="numeric"
              min="0"
              required
              defaultValue={transaction.amount}
              className={fieldClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="type" label="Jenis">
              <select
                id="type"
                name="type"
                defaultValue={transaction.type}
                className={fieldClass}
              >
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </Field>

            <Field name="account" label="Kas">
              <select
                id="account"
                name="account"
                defaultValue={transaction.account}
                className={fieldClass}
              >
                {Object.entries(ACCOUNT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field name="category" label="Kategori">
            <select
              id="category"
              name="category"
              defaultValue={transaction.category}
              className={fieldClass}
            >
              <optgroup label="Pemasukan">
                {INCOME_CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </optgroup>
              <optgroup label="Pengeluaran">
                {EXPENSE_CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </optgroup>
            </select>
          </Field>

          <Field
            name="description"
            label="Keterangan"
            error={errors.description?.[0]}
          >
            <input
              id="description"
              name="description"
              required
              defaultValue={transaction.description}
              className={fieldClass}
            />
          </Field>

          <Field
            name="eventId"
            label="Tautkan ke ibadah"
            hint="Opsional — kosongkan kalau transaksi ini berdiri sendiri."
          >
            <input
              id="eventId"
              name="eventId"
              defaultValue={transaction.eventId ?? ""}
              className={fieldClass}
            />
          </Field>

          {errors.form && (
            <p
              role="alert"
              className="rounded-md bg-danger-wash px-3 py-2.5 text-sm text-danger"
            >
              {errors.form[0]}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="btn-outline text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn-primary text-sm"
            >
              {pending ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        kicker="Konfirmasi"
        title="Hapus transaksi ini?"
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{transaction.description}</span>{" "}
          senilai {formatRupiah(transaction.amount)} akan berhenti dihitung di
          saldo. Barisnya tetap tersimpan untuk audit dan bisa dipulihkan.
        </p>

        {deleteError && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-danger-wash px-3 py-2.5 text-sm text-danger"
          >
            {deleteError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
            className="btn-outline text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="min-h-[44px] rounded-md bg-danger px-4 text-sm font-semibold text-canvas transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Menghapus…" : "Hapus"}
          </button>
        </div>
      </Modal>
    </>
  );
}
