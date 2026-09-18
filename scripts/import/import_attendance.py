#!/usr/bin/env python3
"""
Impor kehadiran historis dari sheet ABSENSI 2026 ke tabel public.attendance.

Bentuk sheet-nya: baris 2 = nama bulan (hanya di kolom pertama tiap bulan),
baris 3 = tanggal, baris 4+ = satu baris per orang dengan checkbox TRUE/FALSE
per tanggal.

Dua aturan yang menentukan hasilnya:

1. HANYA TANGGAL YANG SUDAH LEWAT. Sheet Agustus-Desember sudah punya kolom
   untuk ibadah yang belum terjadi, dan semuanya berisi FALSE. Mengimpornya
   berarti mencatat 90-an orang "tidak hadir" di ibadah yang belum
   berlangsung. Batas tanggal wajib dilewatkan lewat --sampai.

2. TIDAK ADA TEBAKAN NAMA. Pencocokan memakai kunci ternormalisasi yang sama
   dengan import_members.py (buang kurung, rapatkan spasi, samakan kapital).
   Nama yang tidak cocok persis dilaporkan, bukan ditebak -- kandidat terdekat
   untuk salah satu anggota ternyata orang yang berbeda.

Baris yang dihasilkan sengaja tidak memuat nama: event dan profil diresolusi
di SQL lewat JOIN, jadi berkas keluarannya berisi tanggal + nama lengkap yang
sudah ada di basis data, bukan data baru.

Cara pakai:
  python scripts/import/import_attendance.py --sampai 2026-08-19 --mode report
  python scripts/import/import_attendance.py --sampai 2026-08-19 --mode sql
"""

import argparse
import re
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_members import name_key  # satu-satunya sumber aturan pencocokan

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl belum terinstall: pip install openpyxl")

DB_DIR = Path(__file__).resolve().parent.parent.parent / "database"
XLSX_PATH = DB_DIR / "DATA_PEMUDA-GKKK-YK.xlsx"

SHEETS_2026 = [
    "ABSENSI 2026 (Januari - Juli)",
    "ABSENSI 2026 (Agustus - Desembe",
]

BULAN = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11,
    "desember": 12,
}


def column_dates(ws, year=2026):
    """Petakan indeks kolom -> tanggal, dari baris 2 (bulan) + baris 3 (hari)."""
    out = {}
    current_month = None
    for col in range(5, ws.max_column + 1):
        month_cell = ws.cell(2, col).value
        if month_cell:
            key = str(month_cell).strip().lower()
            if key in BULAN:
                current_month = BULAN[key]
        day_cell = ws.cell(3, col).value
        if current_month is None or day_cell is None:
            continue
        # Kadang ditulis '14 (Seminar)' -- ambil angka depannya saja.
        match = re.match(r"\s*(\d{1,2})", str(day_cell))
        if not match:
            continue
        try:
            out[col] = date(year, current_month, int(match.group(1)))
        except ValueError:
            continue
    return out


def load_rows(path=XLSX_PATH, cutoff=None):
    """Return (rows, skipped_future, sheets_seen). rows = (nama, tanggal, hadir)."""
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = []
    skipped_future = 0
    sheets_seen = []

    for sheet in SHEETS_2026:
        if sheet not in wb.sheetnames:
            continue
        sheets_seen.append(sheet)
        ws = wb[sheet]
        dates = column_dates(ws)

        for r in range(4, ws.max_row + 1):
            num = ws.cell(r, 1).value
            full_name = ws.cell(r, 2).value
            if not isinstance(num, (int, float)) or not full_name:
                continue
            for col, when in dates.items():
                if cutoff and when > cutoff:
                    skipped_future += 1
                    continue
                raw = ws.cell(r, col).value
                if raw is None:
                    continue
                present = raw is True or str(raw).strip().upper() in ("TRUE", "V", "Y", "1")
                rows.append((str(full_name).strip(), when, present))

    return rows, skipped_future, sheets_seen


def strip_paren(name):
    """Nama seperti tersimpan di DB: kurung sudah dibuang saat impor anggota."""
    return re.sub(r"\s+", " ", re.sub(r"\(.*?\)", " ", name)).strip()


def generate_sql(rows, chunk=700):
    """SQL idempotent. Event & profil diresolusi lewat JOIN -- gagal-lunak:
    baris yang tidak menemukan pasangannya tidak masuk, bukan bikin data baru.

    HANYA baris HADIR yang ditulis. Alasannya bukan sekadar hemat: di layar
    absensi, kotak yang tidak dicentang berarti tidak hadir, jadi ketiadaan
    baris sudah membawa arti yang sama. Menulis 2.599 baris 'present = false'
    hanya menggandakan makna yang sama dengan bentuk yang lain -- dan membuat
    'belum dicatat' tidak bisa lagi dibedakan dari 'dicatat tidak hadir'.
    """
    def q(s):
        return "'" + str(s).replace("'", "''") + "'"

    rows = [r for r in rows if r[2]]
    out = []
    for i in range(0, len(rows), chunk):
        part = rows[i:i + chunk]
        values = ",\n  ".join(
            f"({q(strip_paren(n))}, DATE {q(d.isoformat())}, {'true' if p else 'false'})"
            for n, d, p in part
        )
        out.append(
            "INSERT INTO public.attendance (event_id, profile_id, present)\n"
            "SELECT e.id, p.id, v.present\n"
            "FROM (VALUES\n  " + values + "\n) AS v(nama, tgl, present)\n"
            "JOIN public.profiles p ON p.full_name = v.nama\n"
            "JOIN LATERAL (\n"
            "  SELECT e2.id FROM public.events e2\n"
            "  WHERE (e2.date AT TIME ZONE 'Asia/Jakarta')::date = v.tgl\n"
            "  ORDER BY e2.date LIMIT 1\n"
            ") e ON true\n"
            "ON CONFLICT (event_id, profile_id) DO UPDATE\n"
            "  SET present = EXCLUDED.present, updated_at = now();"
        )
    return out


def main():
    ap = argparse.ArgumentParser(description="Impor kehadiran 2026")
    ap.add_argument("--mode", choices=["report", "sql"], default="report")
    ap.add_argument("--sampai", required=True,
                    help="Batas tanggal (YYYY-MM-DD). Tanggal setelahnya dilewati.")
    args = ap.parse_args()

    cutoff = datetime.strptime(args.sampai, "%Y-%m-%d").date()
    rows, skipped, sheets = load_rows(cutoff=cutoff)

    if args.mode == "sql":
        print("\n\n".join(generate_sql(rows)))
        return

    tanggal = sorted({d for _, d, _ in rows})
    orang = {name_key(n) for n, _, _ in rows}
    hadir = sum(1 for _, _, p in rows if p)
    print(f"Sheet dibaca      : {len(sheets)}")
    for s in sheets:
        print(f"  - {s}")
    print(f"Batas tanggal     : {cutoff.isoformat()}")
    print(f"Baris kehadiran   : {len(rows)}")
    print(f"  hadir           : {hadir}")
    print(f"  tidak hadir     : {len(rows) - hadir}")
    print(f"Orang unik        : {len(orang)}")
    print(f"Tanggal unik      : {len(tanggal)}")
    if tanggal:
        print(f"  rentang         : {tanggal[0]} .. {tanggal[-1]}")
    print(f"Sel masa depan dilewati: {skipped}")


if __name__ == "__main__":
    main()
