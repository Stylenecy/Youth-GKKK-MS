// Category set mirrors Nathan's Chart of Accounts (401-405 income, 501-510
// expense) exactly — the point is YGMS absorbs his spreadsheet's structure,
// not the other way around. Keys are stored in the DB; labels are what he
// already calls them, so pasted data from his sheet matches by label.
export const INCOME_CATEGORIES: Array<[string, string]> = [
  ["persembahan_pemuda", "Persembahan Pemuda"],
  ["iuran_pemuda", "Iuran Pemuda"],
  ["donasi", "Donasi"],
  ["dana_gereja", "Dana dari Gereja"],
  ["penerimaan_kegiatan", "Penerimaan Kegiatan"],
];

export const EXPENSE_CATEGORIES: Array<[string, string]> = [
  ["konsumsi", "Konsumsi"],
  ["transportasi", "Transportasi"],
  ["perlengkapan", "Perlengkapan"],
  ["sewa_tempat", "Sewa Tempat/Bangunan"],
  ["design_dokumentasi", "Design dan Dokumentasi"],
  ["musik_worship", "Musik/Worship"],
  ["apresiasi_hadiah", "Apresiasi dan Hadiah"],
  ["sosial", "Sosial"],
  ["administrasi", "Administrasi"],
  ["lain_lain", "Pengeluaran Lain-lain"],
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(ALL_CATEGORIES);

export const ACCOUNT_LABEL: Record<string, string> = {
  kas_besar: "Kas Besar",
  kas_kecil: "Kas Kecil",
};

/** Reverse lookup for bulk import: match a pasted label (from Nathan's sheet) back to its key. */
export function categoryKeyFromLabel(label: string): string | null {
  const normalized = label.trim().toLowerCase();
  const hit = ALL_CATEGORIES.find(([, l]) => l.toLowerCase() === normalized);
  return hit ? hit[0] : null;
}
