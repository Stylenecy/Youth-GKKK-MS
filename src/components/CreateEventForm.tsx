"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createEvent } from "@/app/actions/gatherings";
import type { Profile } from "@/lib/types";
import { Modal, Field, fieldClass } from "./Modal";
import { EVENT_TYPE_LABEL } from "@/lib/datetime";

type FieldErrors = Record<string, string[] | undefined>;

export function CreateEventForm({ profiles }: { profiles: Profile[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await createEvent(formData);
      if (result.success) {
        setIsOpen(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrors((result.errors ?? {}) as FieldErrors);
      }
    });
  }

  return (
    <>
      {/* Announced to screen readers, not just shown. */}
      <div aria-live="polite" className="sr-only">
        {success ? "Ibadah berhasil disimpan" : ""}
      </div>
      {success && (
        <p className="fixed right-4 top-4 z-50 rounded-md bg-sage px-4 py-2.5 text-sm font-semibold text-canvas shadow-lg">
          Ibadah berhasil disimpan
        </p>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-primary text-sm"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Ibadah baru
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="Jadwal"
        title="Tambah ibadah"
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="date" label="Tanggal" error={errors.date?.[0]}>
              <input
                id="date"
                name="date"
                type="date"
                required
                className={fieldClass}
              />
            </Field>

            <Field name="time" label="Jam (WIB)" error={errors.time?.[0]}>
              <input
                id="time"
                name="time"
                type="time"
                required
                defaultValue="17:00"
                className={fieldClass}
              />
            </Field>
          </div>

          <Field name="eventType" label="Jenis">
            <select id="eventType" name="eventType" className={fieldClass}>
              {Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            name="weeklyTheme"
            label="Tema minggu ini"
            error={errors.weeklyTheme?.[0]}
          >
            <input
              id="weeklyTheme"
              name="weeklyTheme"
              required
              placeholder="Misal: Unchained, Not Unchecked"
              className={fieldClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="picId" label="Penanggung jawab" error={errors.picId?.[0]}>
              <select id="picId" name="picId" required className={fieldClass}>
                <option value="">Pilih orang</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              name="speakerName"
              label="Pembicara"
              error={errors.speakerName?.[0]}
            >
              <input
                id="speakerName"
                name="speakerName"
                required
                placeholder="Nama pembicara"
                className={fieldClass}
              />
            </Field>
          </div>

          <Field name="description" label="Keterangan" hint="Boleh dikosongkan.">
            <textarea
              id="description"
              name="description"
              rows={3}
              className={`${fieldClass} resize-none`}
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
              {pending ? "Menyimpan…" : "Simpan ibadah"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
