"use client";

import { RouteError } from "@/components/RouteStates";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError title="Buku Kas" error={error} retry={retry} />;
}
