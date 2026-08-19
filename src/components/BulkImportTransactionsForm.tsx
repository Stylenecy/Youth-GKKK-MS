"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTransactions, type ImportRowError } from "@/app/actions/finance";
import { FileSpreadsheet, Check, AlertCircle } from "lucide-react";

/**
 * Paste-and-validate import for legacy cash data with Nocturne styling.
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline text-xs sm:text-sm font-semibold"
      >
        <FileSpreadsheet className="h-4 w-4 mr-1.5" />
        Buka Format Tempel Data Spreadsheet
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <FileSpreadsheet className="h-4 w-4 text-accent" />
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Format Salin Spreadsheet (Excel / Google Sheets)
        </p>
      </div>

      <p className="text-xs sm:text-sm leading-relaxed text-ink-muted">
        Satu baris mewakili satu transaksi, setiap kolom dipisahkan oleh TAB (otomatis terbentuk saat salin range dari Excel/Google Sheets). Urutan kolom:{" "}
        <span className="font-mono text-ink font-semibold">Tanggal</span> ·{" "}
        <span className="font-mono text-ink font-semibold">Kas Besar/Kas Kecil</span> ·{" "}
        <span className="font-mono text-ink font-semibold">Pemasukan/Pengeluaran</span> ·{" "}
        <span className="font-mono text-ink font-semibold">Kategori</span> ·{" "}
        <span className="font-mono text-ink font-semibold">Jumlah</span> ·{" "}
        <span className="font-mono text-ink font-semibold">Keterangan</span>.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="2026-01-10	Kas Kecil	Pemasukan	Persembahan Pemuda	57000	Persembahan Cash Ibadah"
        className="mt-4 min-h-[120px] w-full rounded-xl border border-rule bg-canvas-sunk p-3.5 font-mono text-xs text-ink placeholder:text-ink-faint transition-all duration-200 focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
      />

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-wash p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-danger/30 bg-danger-wash/50 p-3 text-xs text-danger">
          {errors.map((e) => (
            <li key={e.line}>
              <strong>Baris {e.line}:</strong> {e.message}
            </li>
          ))}
        </ul>
      )}

      {done !== null && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sage/40 bg-sage-wash p-3 text-xs font-semibold text-sage">
          <Check className="h-4 w-4" />
          {done} baris transaksi berhasil diimpor ke buku kas.
        </div>
      )}

      <div className="mt-4 flex justify-end gap-3 border-t border-rule-soft pt-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-outline text-xs sm:text-sm"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !text.trim()}
          className="btn-primary text-xs sm:text-sm disabled:opacity-60"
        >
          {pending ? "Memvalidasi Data…" : "Periksa & Impor"}
        </button>
      </div>
    </div>
  );
}
