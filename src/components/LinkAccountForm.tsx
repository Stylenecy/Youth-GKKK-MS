"use client";

import { useState, useTransition } from "react";
import { linkAccountToProfile } from "@/app/actions/accounts";
import { callAction } from "@/lib/call-action";
import { useToast } from "./Toast";
import { fieldClass } from "./Modal";

/**
 * "Perlu dicek": an approved login that no member matched by email. The
 * admin picks who it is; the member then remembers this email, so the next
 * login from it links without anyone's help.
 */
export function LinkAccountForm({
  userId,
  email,
  members,
}: {
  userId: string;
  email: string;
  members: { id: string; label: string }[];
}) {
  const [profileId, setProfileId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const selectId = `link-${userId}`;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => linkAccountToProfile(userId, profileId));
      if (result.success) {
        const who = members.find((m) => m.id === profileId)?.label ?? "anggota itu";
        toast({ message: `${email} kini tertaut ke ${who}.` });
      } else {
        setError(result.error ?? "Gagal menautkan akun.");
      }
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <label htmlFor={selectId} className="sr-only">
        Anggota untuk akun {email}
      </label>
      <select
        id={selectId}
        value={profileId}
        onChange={(e) => setProfileId(e.target.value)}
        className={`${fieldClass} min-w-[12rem] flex-1 py-2 text-xs`}
      >
        <option value="">Pilih anggota…</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={submit}
        disabled={!profileId || pending}
        className="btn-outline text-xs disabled:opacity-60"
      >
        {pending ? "Menautkan…" : "Tautkan"}
      </button>
      {error && (
        <p role="alert" className="w-full rounded-xl border border-danger/40 bg-danger-wash px-3.5 py-2.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
