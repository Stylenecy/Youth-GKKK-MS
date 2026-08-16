import { NextResponse } from "next/server";
import { getFinanceTransactions } from "@/lib/data";
import { CATEGORY_LABEL, ACCOUNT_LABEL } from "@/lib/finance";

/** CSV export of the cash book — protected by proxy.ts like every /dashboard route. */
export async function GET() {
  const transactions = await getFinanceTransactions();
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const rows = [
    ["Tanggal", "Kas", "Jenis", "Kategori", "Jumlah", "Keterangan"],
    ...sorted.map((t) => [
      t.createdAt.slice(0, 10),
      ACCOUNT_LABEL[t.account] ?? t.account,
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      CATEGORY_LABEL[t.category] ?? t.category,
      String(t.amount),
      t.description,
    ]),
  ];

  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kas-pemuda-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
