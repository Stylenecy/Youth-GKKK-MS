"use server";

import { revalidatePath } from "next/cache";
import { financeSchema } from "@/lib/schemas";
import { categoryKeyFromLabel, CATEGORY_LABEL } from "@/lib/finance";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Only the treasurer (Nathan) or an admin may write to the cash book.
 * Checked here for a friendly message; RLS (migration 0005) is the real
 * boundary — this exists so a non-treasurer sees "kamu bukan bendahara"
 * instead of a raw Postgres permission error.
 */
async function requireTreasurer() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Kamu belum masuk." };

  const { data: role } = await supabase.rpc("get_my_app_role");
  if (role !== "admin" && role !== "treasurer") {
    return { ok: false as const, error: "Kamu bukan bendahara — cuma bendahara dan admin yang bisa mencatat transaksi." };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function createTransaction(formData: FormData) {
  const rawData = {
    amount: formData.get("amount"),
    type: formData.get("type") as string,
    account: formData.get("account") as string,
    category: formData.get("category") as string,
    description: formData.get("description") as string,
    eventId: formData.get("eventId") as string,
  };

  const validated = financeSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  if (isSupabaseConfigured()) {
    const auth = await requireTreasurer();
    if (!auth.ok) return { success: false, errors: { form: [auth.error] } };

    const { error } = await auth.supabase.from("finance_transactions").insert({
      amount: validated.data.amount,
      type: validated.data.type,
      account: validated.data.account,
      category: validated.data.category,
      description: validated.data.description,
      event_id: validated.data.eventId || null,
      recorded_by: auth.userId,
    });

    if (error) {
      return { success: false, errors: { form: [error.message] } };
    }
  }

  revalidatePath("/dashboard/finance");
  return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
  const rawData = {
    amount: formData.get("amount"),
    type: formData.get("type") as string,
    account: formData.get("account") as string,
    category: formData.get("category") as string,
    description: formData.get("description") as string,
    eventId: formData.get("eventId") as string,
  };

  const validated = financeSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  if (isSupabaseConfigured()) {
    const auth = await requireTreasurer();
    if (!auth.ok) return { success: false, errors: { form: [auth.error] } };

    const { error } = await auth.supabase
      .from("finance_transactions")
      .update({
        amount: validated.data.amount,
        type: validated.data.type,
        account: validated.data.account,
        category: validated.data.category,
        description: validated.data.description,
        event_id: validated.data.eventId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, errors: { form: [error.message] } };
    }
  }

  revalidatePath("/dashboard/finance");
  return { success: true };
}

/**
 * "Delete" a transaction.
 *
 * Soft delete, for the same reason events are archived rather than dropped:
 * a cash book that can silently lose rows cannot be audited. The row stays,
 * stops counting toward any balance, and can be restored.
 *
 * Requires migration 0002 (adds finance_transactions.deleted_at).
 */
export async function deleteTransaction(id: string) {
  if (isSupabaseConfigured()) {
    const auth = await requireTreasurer();
    if (!auth.ok) return { success: false, error: auth.error };

    const { error } = await auth.supabase
      .from("finance_transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/finance");
  return { success: true };
}

/** Undo a soft delete. */
export async function restoreTransaction(id: string) {
  if (isSupabaseConfigured()) {
    const auth = await requireTreasurer();
    if (!auth.ok) return { success: false, error: auth.error };

    const { error } = await auth.supabase
      .from("finance_transactions")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/finance");
  return { success: true };
}

export type ImportRow = {
  line: number;
  date: string;
  account: string;
  type: string;
  categoryLabel: string;
  amount: string;
  description: string;
};

export type ImportRowError = { line: number; message: string };

/**
 * Bulk import from a pasted block of Nathan's data — the safe alternative
 * to a fully automatic import. Format: one transaction per line, columns
 * separated by tab (what you get pasting straight out of Sheets/Excel):
 *   Tanggal | Akun (Kas Besar/Kas Kecil) | Jenis (Pemasukan/Pengeluaran) | Kategori | Jumlah | Keterangan
 *
 * All-or-nothing: if any line fails validation, nothing is inserted, so a
 * typo in row 40 can't leave rows 1-39 committed and the rest missing.
 */
export async function importTransactions(pastedText: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase belum tersambung.", errors: [] as ImportRowError[] };
  }

  const auth = await requireTreasurer();
  if (!auth.ok) return { success: false, error: auth.error, errors: [] as ImportRowError[] };

  const lines = pastedText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { success: false, error: "Tidak ada baris untuk diimpor.", errors: [] as ImportRowError[] };
  }

  const errors: ImportRowError[] = [];
  const toInsert: Array<Record<string, unknown>> = [];

  lines.forEach((line, idx) => {
    const cols = line.split("\t").map((c) => c.trim());
    if (cols.length < 6) {
      errors.push({ line: idx + 1, message: `Kolom kurang (dapat ${cols.length}, butuh 6, dipisah TAB)` });
      return;
    }
    const [dateStr, accountLabel, typeLabel, categoryLabel, amountStr, description] = cols;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      errors.push({ line: idx + 1, message: `Tanggal tidak valid: "${dateStr}"` });
      return;
    }

    const account = accountLabel.toLowerCase().includes("besar") ? "kas_besar"
      : accountLabel.toLowerCase().includes("kecil") ? "kas_kecil" : null;
    if (!account) {
      errors.push({ line: idx + 1, message: `Akun harus "Kas Besar" atau "Kas Kecil", dapat "${accountLabel}"` });
      return;
    }

    const type = typeLabel.toLowerCase().startsWith("pemasuk") || typeLabel.toLowerCase() === "income" ? "income"
      : typeLabel.toLowerCase().startsWith("pengeluar") || typeLabel.toLowerCase() === "expense" ? "expense" : null;
    if (!type) {
      errors.push({ line: idx + 1, message: `Jenis harus "Pemasukan" atau "Pengeluaran", dapat "${typeLabel}"` });
      return;
    }

    const category = categoryKeyFromLabel(categoryLabel);
    if (!category) {
      errors.push({ line: idx + 1, message: `Kategori "${categoryLabel}" tidak dikenali. Kategori yang valid: ${Object.values(CATEGORY_LABEL).join(", ")}` });
      return;
    }

    const amount = Number(amountStr.replace(/[^\d.-]/g, ""));
    if (!amount || amount <= 0) {
      errors.push({ line: idx + 1, message: `Jumlah tidak valid: "${amountStr}"` });
      return;
    }

    if (!description || description.length < 1) {
      errors.push({ line: idx + 1, message: "Keterangan kosong" });
      return;
    }

    toInsert.push({
      amount,
      type,
      account,
      category,
      description,
      recorded_by: auth.userId,
      created_at: date.toISOString(),
    });
  });

  if (errors.length > 0) {
    return { success: false, error: `${errors.length} baris bermasalah, tidak ada yang diimpor.`, errors };
  }

  const { error } = await auth.supabase.from("finance_transactions").insert(toInsert);
  if (error) {
    return { success: false, error: error.message, errors: [] as ImportRowError[] };
  }

  revalidatePath("/dashboard/finance");
  return { success: true, error: null, errors: [] as ImportRowError[], count: toInsert.length };
}
