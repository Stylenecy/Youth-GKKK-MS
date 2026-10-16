"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateEvent } from "@/app/actions/gatherings";
import type { Event, Profile } from "@/lib/types";
import { Modal, Field, fieldClass } from "./Modal";
import {
  EVENT_TYPE_LABEL,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/datetime";
import { callAction } from "@/lib/call-action";
import { savedMessage } from "@/lib/demo";
import { useToast } from "./Toast";

type FieldErrors = Record<string, string[] | undefined>;

export function EditEventForm({
  event,
  profiles,
}: {
  event: Event;
  profiles: Profile[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await callAction(() => updateEvent(event.id, formData));
      if (result.success) {
        setIsOpen(false);
        // The shared toast (role=status) is both the visible and the
        // announced confirmation — one sentence, never a demo "saved" claim.
        toast({ message: savedMessage("Perubahan ibadah berhasil disimpan.") });
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
        className="btn-outline text-xs sm:text-sm"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Ubah Ibadah
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="EDIT JADWAL"
        title="Ubah Detail Ibadah"
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="date" label="Tanggal Ibadah" error={errors.date?.[0]}>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={toDateInputValue(event.date)}
                className={fieldClass}
              />
            </Field>

            <Field name="time" label="Jam Mulai (WIB)" error={errors.time?.[0]}>
              <input
                id="time"
                name="time"
                type="time"
                required
                defaultValue={toTimeInputValue(event.date)}
                className={fieldClass}
              />
            </Field>
          </div>

          <Field name="eventType" label="Jenis Acara">
            <select
              id="eventType"
              name="eventType"
              defaultValue={event.eventType}
              className={fieldClass}
            >
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
              defaultValue={event.weeklyTheme}
              className={fieldClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="picId" label="Penanggung Jawab (PIC)" error={errors.picId?.[0]}>
              <select
                id="picId"
                name="picId"
                required
                defaultValue={event.picId ?? ""}
                className={fieldClass}
              >
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
                defaultValue={event.speakerName ?? ""}
                className={fieldClass}
              />
            </Field>
          </div>

          <Field name="description" label="Keterangan / Deskripsi Acara" hint="Opsional — ringkasan nats atau petunjuk khusus.">
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={event.description ?? ""}
              className={`${fieldClass} resize-none`}
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
              onClick={() => setIsOpen(false)}
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
    </>
  );
}
