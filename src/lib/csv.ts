/**
 * Sel yang diawali = + - @ (atau tab/CR) dibaca Excel/Sheets sebagai rumus.
 * Keterangan transaksi diketik bebas, jadi "=HYPERLINK(...)" bisa jadi
 * tautan jahat saat bendahara membuka CSV. Awalan apostrof membuatnya teks
 * biasa (rekomendasi OWASP "CSV Injection").
 *
 * Angka negatif murni ("-85000") dibiarkan supaya kolom jumlah tetap angka.
 */
export function neutralizeFormula(cell: string): string {
  if (/^-?\d+(\.\d+)?$/.test(cell)) return cell;
  return /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((r) =>
      r.map((cell) => `"${neutralizeFormula(String(cell)).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}
