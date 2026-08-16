"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createTransaction } from "@/app/actions/finance";
import { Modal, Field, fieldClass } from "./Modal";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNT_LABEL } from "@/lib/finance";

type FieldErrors = Record<string, string[] | undefined>;

export function CreateTransactionForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await createTransaction(formData);
      if (result.success) {
        setIsOpen(false);
      } else {
        setErrors((result.errors ?? {}) as FieldErrors);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-primary text-sm"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Transaksi baru
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="Keuangan"
        title="Catat transaksi"
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
              placeholder="0"
              className={fieldClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="type" label="Jenis">
              <select id="type" name="type" className={fieldClass}>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </Field>

            <Field name="account" label="Kas">
              <select id="account" name="account" className={fieldClass}>
                {Object.entries(ACCOUNT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field name="category" label="Kategori">
            <select id="category" name="category" className={fieldClass}>
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
              placeholder="Misal: kabel HDMI pengganti"
              className={fieldClass}
            />
          </Field>

          <Field
            name="eventId"
            label="Tautkan ke ibadah"
            hint="Opsional — isi ID ibadah kalau transaksi ini bagian dari satu acara."
          >
            <input
              id="eventId"
              name="eventId"
              placeholder="Misal: e1"
              className={fieldClass}
            />
          </Field>

          {errors.form && (
            <p role="alert" className="rounded-md bg-danger-wash px-3 py-2.5 text-sm text-danger">
              {errors.form[0]}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-outline text-sm"
            >
              Batal
            </button>
            <button type="submit" disabled={pending} className="btn-primary text-sm">
              {pending ? "Menyimpan…" : "Simpan transaksi"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
