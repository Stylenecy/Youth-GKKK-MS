"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { updateTransaction, deleteTransaction } from "@/app/actions/finance";
import type { FinanceTransaction } from "@/lib/types";
import { Modal, Field, fieldClass } from "./Modal";
import { formatRupiah } from "@/lib/datetime";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNT_LABEL } from "@/lib/finance";

type FieldErrors = Record<string, string[] | undefined>;

/**
 * Edit + delete actions for a cash-book row with Nocturne modals.
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
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition-all hover:bg-canvas-sunk hover:text-accent hover:border hover:border-line-accent/40";

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className={iconBtn}
          title="Ubah transaksi"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Ubah transaksi {transaction.description}</span>
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className={`${iconBtn} hover:text-danger hover:border-danger/40`}
          title="Hapus transaksi"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">
            Hapus transaksi {transaction.description}
          </span>
        </button>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        kicker="EDIT BUKU KAS"
        title="Ubah Rincian Transaksi"
      >
        <form action={handleSubmit} className="space-y-4">
          <Field name="amount" label="Nominal (Rp)" error={errors.amount?.[0]}>
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
            <Field name="type" label="Jenis Transaksi">
              <select
                id="type"
                name="type"
                defaultValue={transaction.type}
                className={fieldClass}
              >
                <option value="income">Pemasukan (+)</option>
                <option value="expense">Pengeluaran (−)</option>
              </select>
            </Field>

            <Field name="account" label="Pos Kas">
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

          <Field name="category" label="Kategori Anggaran">
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
            label="Keterangan / Uraian"
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
            label="Tautkan ke ID Ibadah"
            hint="Opsional — isi jika transaksi ini bagian dari acara tertentu."
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
              className="rounded-xl border border-danger/40 bg-danger-wash px-3.5 py-2.5 text-xs text-danger"
            >
              {errors.form[0]}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-rule-soft">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="btn-outline text-xs sm:text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn-primary text-xs sm:text-sm"
            >
              {pending ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        kicker="KONFIRMASI HAPUS"
        title="Hapus Transaksi Kas Ini?"
      >
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-wash/60 p-4">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted">
            Transaksi <strong className="text-ink font-semibold">&ldquo;{transaction.description}&rdquo;</strong> senilai{" "}
            <span className="num font-bold text-accent">{formatRupiah(transaction.amount)}</span> akan berhenti dihitung pada saldo kas. Data tetap tersimpan untuk riwayat audit.
          </p>
        </div>

        {deleteError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-danger-wash p-3 text-xs text-danger"
          >
            {deleteError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-rule-soft pt-3">
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
            className="btn-outline text-xs sm:text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="min-h-[44px] rounded-xl bg-danger px-4 text-xs sm:text-sm font-semibold text-canvas transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Menghapus…" : "Hapus Transaksi"}
          </button>
        </div>
      </Modal>
    </>
  );
}
