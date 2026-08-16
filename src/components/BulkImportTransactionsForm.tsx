"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTransactions, type ImportRowError } from "@/app/actions/finance";

/**
 * Paste-and-validate import for Nathan's existing kas data — the safer
 * alternative to a fully automatic import. Nothing is inserted until every
 * pasted line passes validation, so a mistake can't leave a half-imported
 * cash book.
 */
export function BulkImportTransactionsForm() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<ImportRowError[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    setError(null);
    setErrors([]);
    setDone(null);
    startTransition(async () => {
      const result = await importTransactions(text);
      if (result.success) {
        setDone(result.count ?? 0);
        setText("");
        router.refresh();
      } else {
        setError(result.error);
        setErrors(result.errors);
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-outline mt-2 text-sm">
        Tempel data dari spreadsheet lama
      </button>
    );
  }

  return (
    <div className="card mt-2 p-5">
      <p className="text-sm leading-relaxed text-ink-muted">
        Satu baris satu transaksi, kolom dipisah TAB (hasil salin langsung dari
        Excel/Sheets sudah begini). Urutan: <span className="font-mono text-ink">Tanggal</span> ·{" "}
        <span className="font-mono text-ink">Kas Besar/Kas Kecil</span> ·{" "}
        <span className="font-mono text-ink">Pemasukan/Pengeluaran</span> ·{" "}
        <span className="font-mono text-ink">Kategori</span> (nama persis seperti di
        Daftar Akun) · <span className="font-mono text-ink">Jumlah</span> ·{" "}
        <span className="font-mono text-ink">Keterangan</span>. Tidak ada yang tersimpan
        sampai semua baris lolos validasi.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="2026-01-10&#9;Kas Kecil&#9;Pemasukan&#9;Persembahan Pemuda&#9;57000&#9;Persembahan Cash"
        className="mt-3 min-h-[44px] w-full rounded-md border border-rule bg-surface px-3 py-2 font-mono text-sm text-ink transition-colors focus:border-accent"
      />

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-danger-wash px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-danger">
          {errors.map((e) => (
            <li key={e.line}>Baris {e.line}: {e.message}</li>
          ))}
        </ul>
      )}
      {done !== null && (
        <p className="mt-3 rounded-md bg-sage-wash px-3 py-2.5 text-sm text-sage">
          {done} transaksi berhasil diimpor.
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-outline text-sm">
          Tutup
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !text.trim()}
          className="btn-primary text-sm disabled:opacity-60"
        >
          {pending ? "Memeriksa…" : "Periksa & impor"}
        </button>
      </div>
    </div>
  );
}
