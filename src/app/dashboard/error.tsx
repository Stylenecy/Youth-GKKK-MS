"use client";

import { RouteError } from "@/components/RouteStates";

/**
 * Catch-all for dashboard pages without their own error boundary (anggota,
 * Cross, ibadah, rapat, pengaturan, audit). Reads in lib/data.ts now throw
 * when the database refuses instead of returning an empty list, so a failed
 * read lands here — an honest "gagal memuat" with a retry — rather than as a
 * roster that silently looks empty.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError title="Halaman Pengurus" error={error} retry={retry} />;
}
