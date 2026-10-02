"use client";

import { RouteError } from "@/components/RouteStates";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError title="Papan Penatalayan" error={error} retry={retry} />;
}
