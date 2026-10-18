"use client";

import { setPengurus } from "@/app/actions/members";
import { ConfirmAction } from "./ConfirmAction";

/**
 * Admin only (the page decides; set_pengurus() checks again in SQL).
 * Pengurus change every two years, so this is a rare, deliberate action —
 * behind a confirmation, not a one-tap switch.
 */
export function PengurusToggle({
  profileId,
  name,
  isPengurus,
}: {
  profileId: string;
  name: string;
  isPengurus: boolean;
}) {
  return isPengurus ? (
    <ConfirmAction
      label="Cabut tanda Pengurus"
      title={`Cabut tanda Pengurus dari ${name}?`}
      body={`${name} tidak lagi muncul sebagai pilihan PIC ibadah. Ibadah yang sudah dipimpinnya tidak berubah.`}
      confirmLabel="Cabut"
      variant="outline"
      onConfirm={() => setPengurus(profileId, false)}
      successMessage={`${name} tidak lagi ditandai Pengurus.`}
    />
  ) : (
    <ConfirmAction
      label="Tandai sebagai Pengurus"
      title={`Tandai ${name} sebagai Pengurus?`}
      body={`${name} akan bisa dipilih sebagai PIC ibadah.`}
      confirmLabel="Tandai"
      variant="outline"
      onConfirm={() => setPengurus(profileId, true)}
      successMessage={`${name} kini ditandai Pengurus.`}
    />
  );
}
