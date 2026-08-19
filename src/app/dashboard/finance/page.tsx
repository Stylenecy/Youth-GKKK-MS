import type { Metadata } from "next";
import { Download, Wallet, ArrowDownRight, ArrowUpRight, Plus, FileSpreadsheet } from "lucide-react";
import { getFinanceTransactions } from "@/lib/data";
import { CreateTransactionForm } from "@/components/CreateTransactionForm";
import { TransactionRowActions } from "@/components/TransactionRowActions";
import { BulkImportTransactionsForm } from "@/components/BulkImportTransactionsForm";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { formatShortDate, formatRupiah, formatRupiahCompact } from "@/lib/datetime";
import { CATEGORY_LABEL, ACCOUNT_LABEL } from "@/lib/finance";

export const metadata: Metadata = { title: "Kas Keuangan" };

export default async function FinancePage() {
  const transactions = await getFinanceTransactions();

  const income = transactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const totalBalance = income - expense;

  const balanceOf = (account: "kas_besar" | "kas_kecil") =>
    transactions
      .filter((t) => t.account === account)
      .reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const summary = [
    {
      kicker: "KAS BESAR",
      label: "Rekening Utama Komisi",
      value: formatRupiah(balanceOf("kas_besar")),
      compact: formatRupiahCompact(balanceOf("kas_besar")),
      highlight: false,
    },
    {
      kicker: "KAS KECIL",
      label: "Kas Operasional Tunai",
      value: formatRupiah(balanceOf("kas_kecil")),
      compact: formatRupiahCompact(balanceOf("kas_kecil")),
      highlight: false,
    },
    {
      kicker: "TOTAL SALDO KAS",
      label: "Akumulasi Keseluruhan",
      value: formatRupiah(totalBalance),
      compact: formatRupiahCompact(totalBalance),
      highlight: true,
    },
  ];

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="BENDAHARA"
        title="Buku Kas & Keuangan"
        meta={`${transactions.length} total transaksi tercatat · Saldo realtime berdasarkan entri transaksi`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/dashboard/finance/export"
              className="btn-outline text-xs sm:text-sm font-semibold"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </a>
            <CreateTransactionForm />
          </div>
        }
      />

      {/* 3 Luxury Balance KPI Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((s) => (
          <div
            key={s.kicker}
            className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 ${
              s.highlight
                ? "border-accent/60 bg-gradient-to-b from-surface to-accent-wash/40 shadow-[0_12px_32px_rgba(253,190,2,0.15)]"
                : "border-line/40 bg-surface/75"
            }`}
          >
            {s.highlight && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-80"
              />
            )}

            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.2em] text-accent">
                ( {s.kicker} )
              </span>
              <Wallet className="h-4 w-4 text-ink-faint" />
            </div>

            <p
              className={`num mt-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl ${
                s.highlight ? "text-accent" : "text-ink"
              }`}
            >
              {s.value}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Financial Health Shelf (Income vs Expense) */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border border-sage/30 bg-sage-wash/60 px-4 py-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-sage" />
            <span className="font-mono uppercase tracking-wider text-ink-muted">Total Pemasukan:</span>
          </div>
          <span className="num font-mono font-bold text-sage">{formatRupiah(income)}</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-danger/30 bg-danger-wash/60 px-4 py-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-danger" />
            <span className="font-mono uppercase tracking-wider text-ink-muted">Total Pengeluaran:</span>
          </div>
          <span className="num font-mono font-bold text-danger">{formatRupiah(expense)}</span>
        </div>
      </div>

      {/* Bulk Import Module */}
      <section className="mt-10" aria-labelledby="import-heading">
        <div className="flex items-center gap-2 border-b border-rule-soft pb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <h2 id="import-heading" className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
            ( IMPOR DARI SPREADSHEET / EXCEL LAMA )
          </h2>
        </div>
        <div className="mt-3">
          <BulkImportTransactionsForm />
        </div>
      </section>

      {/* Transaction History Ledger */}
      <section className="mt-10" aria-labelledby="tx-heading">
        <div className="flex items-center justify-between border-b border-rule-soft pb-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <h2 id="tx-heading" className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
              ( BUKU BESAR TRANSAKSI )
            </h2>
          </div>
          <span className="font-mono text-xs text-ink-faint">
            {sorted.length} Baris
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Belum ada transaksi tercatat"
              body="Catat pemasukan atau pengeluaran per kegiatan di atas, atau gunakan fitur impor dari spreadsheet lama."
              icon={Wallet}
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-rule-soft/60 rounded-2xl border border-line/40 bg-surface/75 backdrop-blur-xl overflow-hidden shadow-sm">
            {sorted.map((t) => (
              <li
                key={t.id}
                className="group flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-2/60 sm:px-6 sm:py-4.5"
              >
                {/* Description & Metadata */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink group-hover:text-accent transition-colors">
                    {t.description}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-ink-muted">
                    {formatShortDate(t.createdAt)} ·{" "}
                    <span className="text-accent font-semibold">{ACCOUNT_LABEL[t.account]}</span> ·{" "}
                    <span className="text-ink-faint">{CATEGORY_LABEL[t.category] ?? t.category}</span>
                  </p>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-4">
                  <span
                    className={`num font-mono text-base font-bold tabular-nums sm:text-lg ${
                      t.type === "income" ? "text-sage" : "text-danger"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatRupiah(t.amount)}
                  </span>
                  <TransactionRowActions transaction={t} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
