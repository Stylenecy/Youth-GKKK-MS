"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/**
 * Loading and error states for dashboard routes. Kept in one file so every
 * route (its own boundary or the dashboard-wide one) says the same thing
 * the same way, in the same header as PageHeader.
 */

export function RouteLoading({ title }: { title: string }) {
  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9" aria-busy="true">
      <p className="lp-meta text-accent">
        <span className="lp-bracket">Memuat</span>
      </p>
      <span className="lp-rule mt-3" aria-hidden="true" />
      <h1 className="lp-title mt-5 text-ink">{title}</h1>
      <p role="status" className="lp-meta mt-3 text-ink-muted">
        Mengambil data terbaru…
      </p>
      <div aria-hidden="true" className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 rounded-lg border border-rule bg-surface motion-safe:animate-pulse"
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
      <p className="lp-meta text-danger">
        <span className="lp-bracket">Gagal memuat</span>
      </p>
      <span className="lp-rule mt-3" aria-hidden="true" />
      <h1 className="lp-title mt-5 text-ink">{title}</h1>
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
