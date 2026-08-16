import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getFinanceTransactions } from "@/lib/data";
import { CreateTransactionForm } from "@/components/CreateTransactionForm";
import { TransactionRowActions } from "@/components/TransactionRowActions";
import { BulkImportTransactionsForm } from "@/components/BulkImportTransactionsForm";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { formatShortDate, formatRupiah, formatRupiahCompact } from "@/lib/datetime";
import { CATEGORY_LABEL, ACCOUNT_LABEL } from "@/lib/finance";

export const metadata: Metadata = { title: "Keuangan" };

export default async function FinancePage() {
  const transactions = await getFinanceTransactions();

  const income = transactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);

  const balanceOf = (account: "kas_besar" | "kas_kecil") =>
    transactions
      .filter((t) => t.account === account)
      .reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const summary = [
    { label: "Kas Besar", value: balanceOf("kas_besar"), cls: "text-ink" },
    { label: "Kas Kecil", value: balanceOf("kas_kecil"), cls: "text-ink" },
    { label: "Total Kas", value: income - expense, cls: "text-accent" },
  ];

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="Kas"
        title="Keuangan"
        meta={`${transactions.length} transaksi tercatat — saldo selalu sampai transaksi terakhir, bukan per bulan`}
        action={
          <div className="flex gap-2">
            <a
              href="/dashboard/finance/export"
              className="btn-outline text-sm"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </a>
            <CreateTransactionForm />
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-3 gap-3">
        {summary.map((s) => (
          <div key={s.label} className="card-surface p-4">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">
              {s.label}
            </p>
            <p className={`num mt-2 font-serif text-xl font-semibold sm:text-2xl ${s.cls}`}>
              {formatRupiahCompact(s.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink-muted">
        <p>Pemasukan: <span className="num text-sage">{formatRupiah(income)}</span></p>
        <p>Pengeluaran: <span className="num text-danger">{formatRupiah(expense)}</span></p>
      </div>

      <section className="mt-9" aria-labelledby="import-heading">
        <h2 id="import-heading" className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint">
          Impor dari catatan lama
        </h2>
        <BulkImportTransactionsForm />
      </section>

      <section className="mt-9" aria-labelledby="tx-heading">
        <h2 id="tx-heading" className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint">
          Riwayat transaksi
        </h2>

        {sorted.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="Belum ada transaksi"
              body="Catat pemasukan dan pengeluaran per kegiatan, atau impor dari catatan lama di atas."
            />
          </div>
        ) : (
          <ul className="mt-3 border-t border-rule">
            {sorted.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 border-b border-rule py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] text-ink">
                    {t.description}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
                    {formatShortDate(t.createdAt)} · {ACCOUNT_LABEL[t.account]} ·{" "}
                    {CATEGORY_LABEL[t.category] ?? t.category}
                  </p>
                </div>
                <span
                  className={`num shrink-0 text-sm font-medium tabular-nums ${
                    t.type === "income" ? "text-sage" : "text-danger"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatRupiah(t.amount)}
                </span>
                <TransactionRowActions transaction={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
