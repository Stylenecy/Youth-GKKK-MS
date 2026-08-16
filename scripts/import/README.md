# Data Import Pipeline

> Pipeline impor data asli Pemuda GKKK ke database Supabase.

## Daftar Isi

- [Sumber Data](#sumber-data)
- [Output](#output)
- [Cara Pakai](#cara-pakai)
- [Mapping Data](#mapping-data)
- [Aturan Privasi](#aturan-privasi)
- [Validasi](#validasi)

---

## Sumber Data

| File | Isi | Sheet/Tab |
|------|-----|-----------|
| `database/DATA-PEMUDA_GKKK.xlsx` | 92 anggota + absensi + ultah | ANGGOTA PEMUDA |
| `database/Data Cross.md` | Susunan 5 Cross (Skema 1) | - |
| `database/DATABASE_FINANCE.md` | Transaksi terverifikasi | - |
| `database/Jadwal Penatalayan Pemuda_.xlsx` | Jadwal ibadah & penatalayan 2026 | 2026 |

## Output

| File | Isi | Bytes |
|------|-----|-------|
| `members.sql` | 92 profiles + skills | ~54 KB |
| `cross.sql` | 5 crosses + 44 memberships | ~10 KB |
| `finance.sql` | 5 transaksi terverifikasi | ~2 KB |
| `events.sql` | 29 events + steward assignments | ~53 KB |
| `00_all.sql` | Gabungan semua (urutan benar) | ~120 KB |

## Cara Pakai

### 1. Validasi saja (dry run)

```bash
python scripts/import/run_all.py
```

Output: ringkasan data source, jumlah baris, sample, duplikat. Tidak menulis file.

### 2. Generate SQL

```bash
python scripts/import/run_all.py --execute
```

Output: folder `scripts/import/output/` berisi 4 file SQL + 1 file gabungan.

### 3. Import per-modul

```bash
python scripts/import/import_members.py --mode sql    > members.sql
python scripts/import/import_cross.py --mode sql      > cross.sql
python scripts/import/import_finance.py --mode sql    > finance.sql
python scripts/import/import_events.py --mode sql     > events.sql
```

### 4. Jalankan SQL di Supabase

Buka Supabase Dashboard → SQL Editor → paste isi `00_all.sql` → Run.

---

## Mapping Data

### Members → profiles

| Excel Column | DB Column | Catatan |
|---|---|---|
| No | id | Format: `p001`, `p002`, ... (deterministik) |
| Nama | full_name | Nama lengkap (bisa ada catatan dalam kurung) |
| Nama Panggilan | nickname | Nama panggilan sehari-hari |
| ~~No. Telepon~~ | ~~DI-SKIP~~ | Privasi — tidak masuk output |
| Asal/Domisili | hometown | Bisa NULL |
| Tanggal Lahir | birth_date | Berbagai format tanggal di-normalize |
| Bidang Pelayanan | skills (table) | Parsed per-kategori |

### Cross → crosses + cross_memberships

| Cross ID | Name | Leader | Members |
|---|---|---|---|
| c1 | Cross 1 | Erica | 10 |
| c2 | Cross 2 | Wangke | 11 |
| c3 | Cross 3 | Dex | 6 |
| c4 | Cross 4 | Nathan | 4 |
| c5 | Cross 5 | Angel | 8 |

### Events → events + steward_assignments

29 ibadah (Jan-Jul 2026), masing-masing dengan 5-11 penatalayan.

### Finance → finance_transactions

5 transaksi terverifikasi (5 di-skip karena data ambigu).

---

## Aturan Privasi

1. **No. telepon TIDAK PERNAH masuk output.** Kolom ini ada di Excel tapi di-skip oleh parser.
2. **Tanggal lahir hanya di SQL ini** — TIDAK boleh masuk `src/lib/seed.ts` yang ter-commit.
3. **Nama asli hanya di SQL ini** — hanya 8 nickname yang di-authorized untuk seed.ts.
4. **File SQL ini TIDAK untuk di-commit ke repo** tanpa review Dex (berisi data sensitif).

---

## Validasi

Pipeline ini menerapkan validasi "gagal semua" — jika ada satu baris yang tidak valid, tidak ada data yang di-output. Validasi termasuk:

- Tanggal dalam format yang benar
- Nama tidak kosong
- Kategori skill yang dikenal
- Cross leader ada di data anggota
- Transaksi memiliki jumlah & tanggal yang jelas

### Duplikat yang Diketahui

Pada data anggota, ada 3 nickname yang duplikat:
- **Dian** — Dian Savitri (2007) & Heartdiantami (2006)
- **Nathan** — Nathanael Sugianto (2005) & Nathannael Culver (2006)
- **Joshua** — Joshua Arsta (2001) & Joshua Alexander Kurniadi (2008)

Duplikat ini ditampilkan dalam report. Saat import ke Supabase, nickname yang sama akan menyebabkan ambigu saat lookup via `WHERE nickname = '...'` — perlu ditangani manual (tambah disambigusi by ID).
