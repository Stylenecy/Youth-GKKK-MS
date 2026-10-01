import { NextResponse } from "next/server";
import { getFinanceTransactions } from "@/lib/data";
import { CATEGORY_LABEL, ACCOUNT_LABEL } from "@/lib/finance";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { FINANCE_ROLES } from "@/lib/roles";
import { requireRole } from "@/lib/role-guard";
import { toCsv } from "@/lib/csv";

/**
 * CSV export of the cash book.
 *
 * proxy.ts only proves someone is signed in, and the dashboard layout's
 * approval gate does not wrap route handlers — so the role is checked here.
 * Hiding the button was not enough: the URL worked for any account.
 */
export async function GET() {
  if (isSupabaseConfigured()) {
    const auth = await requireRole(
      FINANCE_ROLES,
      "Ekspor kas hanya untuk bendahara dan admin."
    );
    if (!auth.ok) {
      return new NextResponse(auth.error, {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  const transactions = await getFinanceTransactions();
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const csv = toCsv([
    ["Tanggal", "Kas", "Jenis", "Kategori", "Jumlah", "Keterangan"],
    ...sorted.map((t) => [
      t.createdAt.slice(0, 10),
      ACCOUNT_LABEL[t.account] ?? t.account,
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      CATEGORY_LABEL[t.category] ?? t.category,
      String(t.amount),
      t.description,
    ]),
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kas-pemuda-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
