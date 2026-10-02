import type { Metadata } from "next";
import { Download, Lock, Wallet } from "lucide-react";
import { getFinanceTransactions, getMyRole, getEvents } from "@/lib/data";
import { canManageFinance } from "@/lib/roles";
import type { FinanceTransaction } from "@/lib/types";
import { CreateTransactionForm } from "@/components/CreateTransactionForm";
import { TransactionRowActions } from "@/components/TransactionRowActions";
import { BulkImportTransactionsForm } from "@/components/BulkImportTransactionsForm";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
  SummaryRows,
  DataTable,
} from "@/components/page-parts";
import { formatShortDate, formatRupiah } from "@/lib/datetime";
import { CATEGORY_LABEL, ACCOUNT_LABEL } from "@/lib/finance";

export const metadata: Metadata = { title: "Buku Kas" };

export default async function FinancePage() {
  // Gate on the server, before any cash data is fetched. RLS "Opsi A"
  // (28 Sep 2026: kas dibaca admin + bendahara saja) is the real boundary;
  // this second layer keeps everyone else from even requesting the rows and
  // explains why instead of rendering a ledger that looks empty.
  // Demo mode (role null) stays a full preview.
  const role = await getMyRole();
  if (!canManageFinance(role)) {
    return (
      <div className="px-5 py-7 sm:px-8 sm:py-9">
        <PageHeader kicker="BENDAHARA" title="Buku Kas" />
        <div className="mt-8">
          <EmptyState
            title="Buku kas khusus bendahara dan admin"
            body="Catatan kas berisi uang Komisi Pemuda, jadi hanya bendahara dan admin yang bisa membukanya. Butuh angka tertentu? Tanyakan ke bendahara."
            icon={Lock}
          />
        </div>
      </div>
    );
  }

  const [transactions, events] = await Promise.all([
    getFinanceTransactions(),
    getEvents(),
  ]);
  // Newest 12 services as link targets — readable labels instead of ids.
  const eventOptions = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12)
    .map((e) => ({ id: e.id, label: `${formatShortDate(e.date)} · ${e.weeklyTheme}` }));

  const sumOf = (rows: FinanceTransaction[], type: "income" | "expense") =>
    rows.filter((t) => t.type === type).reduce((a, b) => a + b.amount, 0);
  const income = sumOf(transactions, "income");
  const expense = sumOf(transactions, "expense");
  const balanceOf = (account: "kas_besar" | "kas_kecil") =>
    transactions
      .filter((t) => t.account === account)
      .reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="BENDAHARA"
        title="Buku Kas"
        meta={`${transactions.length} transaksi tercatat`}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        {/* Balance + the one primary action, kept together */}
        <section aria-labelledby="saldo-heading" className="space-y-4">
          <h2 id="saldo-heading" className="sr-only">
            Saldo
          </h2>
          <SummaryRows
            label="Saldo per kas"
            rows={[
              { label: ACCOUNT_LABEL.kas_besar, value: formatRupiah(balanceOf("kas_besar")) },
              { label: ACCOUNT_LABEL.kas_kecil, value: formatRupiah(balanceOf("kas_kecil")) },
              { label: "Total saldo", value: formatRupiah(income - expense), emphasis: true },
            ]}
          />
          {/* One gold action per screen: while the book is empty the
              empty state below carries "Catat transaksi pertama" instead. */}
          {sorted.length > 0 && (
            <div className="grid gap-2.5 sm:grid-cols-[1fr_auto] lg:grid-cols-1 xl:grid-cols-[1fr_auto]">
              <CreateTransactionForm events={eventOptions} label="Catat transaksi" />
              <a href="/dashboard/finance/export" className="btn-outline justify-center text-sm">
                <Download className="h-4 w-4" aria-hidden="true" />
                Ekspor CSV
              </a>
            </div>
          )}
        </section>

        <section aria-labelledby="tx-heading" className="min-w-0">
          <SectionTitle id="tx-heading" title="Transaksi" meta={`${sorted.length} baris`} />
          <div className="mt-4">
            {sorted.length === 0 ? (
              <EmptyState
                title="Belum ada transaksi"
                body="Catat pemasukan atau pengeluaran pertama, atau tempel baris dari spreadsheet lama lewat tombol Tempel dari spreadsheet di bawah."
                icon={Wallet}
                action={
                  <CreateTransactionForm events={eventOptions} label="Catat transaksi pertama" />
                }
              />
            ) : (
              <DataTable
                caption="Daftar transaksi kas, terbaru di atas"
                rows={sorted}
                rowKey={(t) => t.id}
                columns={[
                  {
                    key: "tanggal",
                    header: "Tanggal",
                    cell: (t) => (
                      <span className="num whitespace-nowrap font-mono text-ink-muted">
                        {formatShortDate(t.createdAt)}
                      </span>
                    ),
                  },
                  {
                    key: "uraian",
                    header: "Uraian",
                    primary: true,
                    cell: (t) => (
                      <>
                        <span className="block font-semibold text-ink">{t.description}</span>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {CATEGORY_LABEL[t.category] ?? t.category} · {ACCOUNT_LABEL[t.account]}
                        </span>
                      </>
                    ),
                  },
                  {
                    key: "jumlah",
                    header: "Jumlah",
                    align: "right",
                    cell: (t) => (
                      <span className={t.type === "income" ? "text-sage" : "text-ink"}>
                        {t.type === "income" ? "+" : "−"}
                        {formatRupiah(t.amount)}
                        <span className="sr-only">
                          {t.type === "income" ? " pemasukan" : " pengeluaran"}
                        </span>
                      </span>
                    ),
                  },
                  {
                    key: "aksi",
                    header: "Ubah atau hapus",
                    srOnlyHeader: true,
                    align: "right",
                    cell: (t) => <TransactionRowActions transaction={t} events={eventOptions} />,
                  },
                ]}
                footer={[
                  { label: "Pemasukan", value: formatRupiah(income) },
                  { label: "Pengeluaran", value: formatRupiah(expense) },
                ]}
              />
            )}
          </div>

          <div className="mt-8 border-t border-rule-soft pt-6">
            <h2 className="text-sm font-semibold text-ink">Banyak baris dari Google Sheets?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Tempel sekaligus; kalau satu baris salah, tidak ada yang masuk.
            </p>
            <div className="mt-3">
              <BulkImportTransactionsForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
