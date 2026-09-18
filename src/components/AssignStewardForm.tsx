"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { assignSteward } from "@/app/actions/gatherings";
import type { Profile } from "@/lib/types";
import { STEWARD_ROLES } from "@/lib/validation";
import { Modal, Field, fieldClass } from "./Modal";

/**
 * The missing half of the steward flow. assignSteward() has existed as a
 * server action since Sprint 2 but never had a caller — the roster card
 * told committee members to "tugaskan tim" with no button to do it.
 * This modal (role + member, two selects) finally wires that action up.
 */
export function AssignStewardForm({
  eventId,
  profiles,
}: {
  eventId: string;
  profiles: Profile[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await assignSteward(
        eventId,
        formData.get("profileId") as string,
        formData.get("role") as string
      );
      if (result.success) {
        setIsOpen(false);
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error ?? "Gagal menugaskan penatalayan.");
      }
    });
  }

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {success ? "Penatalayan berhasil ditugaskan" : ""}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-outline text-xs sm:text-sm"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Tugaskan Penatalayan
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        kicker="PENATALAYAN"
        title="Tugaskan Tim Pelayanan"
      >
        <form action={handleSubmit} className="space-y-4">
          <Field name="role" label="Peran Pelayanan">
            <select
              id="role"
              name="role"
              required
              defaultValue=""
              className={fieldClass}
            >
              <option value="">Pilih peran…</option>
              {STEWARD_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field name="profileId" label="Anggota yang Ditugaskan">
            <select
              id="profileId"
              name="profileId"
              required
              defaultValue=""
              className={fieldClass}
            >
              <option value="">Pilih anggota…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname} ({p.fullName})
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger-wash px-3.5 py-2.5 text-xs text-danger"
            >
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full text-sm">
            Simpan Penugasan
          </button>
        </form>
      </Modal>
    </>
  );
}
