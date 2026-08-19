"use client";

import { useState, useTransition } from "react";
import { Plus, Sparkles } from "lucide-react";
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
      <div aria-live="polite" className="sr-only">
        {success ? "Ibadah berhasil disimpan" : ""}
      </div>
      {success && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border border-sage/50 bg-sage-wash px-4 py-3 text-sm font-semibold text-sage shadow-2xl backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-sage animate-pulse" />
          Ibadah berhasil disimpan dan dijadwalkan.
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-primary text-xs sm:text-sm shadow-[0_0_16px_rgba(253,190,2,0.25)]"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Ibadah Baru
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="JADWAL IBADAH"
        title="Jadwalkan Ibadah Baru"
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="date" label="Tanggal Ibadah" error={errors.date?.[0]}>
              <input
                id="date"
                name="date"
                type="date"
                required
                className={fieldClass}
              />
            </Field>

            <Field name="time" label="Jam Mulai (WIB)" error={errors.time?.[0]}>
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

          <Field name="eventType" label="Jenis Acara">
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
            label="Tema Ibadah Minggu Ini"
            error={errors.weeklyTheme?.[0]}
          >
            <input
              id="weeklyTheme"
              name="weeklyTheme"
              required
              placeholder="Contoh: Unchained, Not Unchecked"
              className={fieldClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="picId" label="Penanggung Jawab (PIC)" error={errors.picId?.[0]}>
              <select id="picId" name="picId" required className={fieldClass}>
                <option value="">Pilih pengurus PIC</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname} ({p.fullName})
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
                placeholder="Nama hamba Tuhan / pembicara"
                className={fieldClass}
              />
            </Field>
          </div>

          <Field name="description" label="Keterangan / Deskripsi Acara" hint="Opsional — ringkasan nats atau petunjuk khusus.">
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Tulis ringkasan atau keterangan singkat untuk warta..."
              className={`${fieldClass} resize-none`}
            />
          </Field>

          {errors.form && (
            <p role="alert" className="rounded-xl border border-danger/40 bg-danger-wash px-3.5 py-2.5 text-xs text-danger">
              {errors.form[0]}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-rule-soft">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-outline text-xs sm:text-sm"
            >
              Batal
            </button>
            <button type="submit" disabled={pending} className="btn-primary text-xs sm:text-sm">
              {pending ? "Menyimpan…" : "Simpan Ibadah"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
