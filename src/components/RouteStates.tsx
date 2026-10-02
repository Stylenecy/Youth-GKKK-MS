"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/**
 * Loading and error states for dashboard routes. Kept in one file so the
 * three pages that need them (Keuangan, detail Ibadah, Penatalayan) say
 * the same thing the same way.
 */

export function RouteLoading({ title }: { title: string }) {
  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9" aria-busy="true">
      <p className="kicker">
        <span className="kicker-num">( MEMUAT )</span>
      </p>
      <h1 className="section-heading mt-2.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      <p role="status" className="mt-1.5 text-sm text-ink-muted">
        Mengambil data terbaru…
      </p>
      <div aria-hidden="true" className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 rounded-xl border border-rule-soft bg-surface motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function RouteError({
  title,
  error,
  retry,
}: {
  title: string;
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Details go to the browser console / server logs, never to the page.
    console.error(error);
  }, [error]);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <p className="kicker">
        <span className="kicker-num">( GAGAL MEMUAT )</span>
      </p>
      <h1 className="section-heading mt-2.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      <div
        role="alert"
        className="mt-6 rounded-xl border border-danger/50 bg-danger-wash/60 px-4 py-4 text-sm leading-relaxed text-ink"
      >
        Halaman ini tidak bisa dimuat — biasanya koneksi terputus atau server
        sedang sibuk. Data tidak berubah. Coba muat lagi; kalau tetap gagal,
        kirim tangkapan layar ini ke admin.
        {error.digest && (
          <span className="mt-2 block font-mono text-xs text-ink-muted">
            Kode: {error.digest}
          </span>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => retry()} className="btn-primary text-sm">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Muat ulang halaman ini
        </button>
        <Link href="/dashboard" className="btn-outline text-sm">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
