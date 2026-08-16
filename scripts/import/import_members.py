#!/usr/bin/env python3
"""
Import anggota pemuda dari DATA-PEMUDA_GKKK.xlsx ke format SQL INSERT.

Aturan privasi (sesuai BRIEF-AI_YGMS.md section1 & section4 dan
BRIEF-AI_YGMS-Kontak-WhatsApp.md section2):
- No. telepon DINORMALISASI ke format 62... lalu disimpan (T1 brief kontak);
  nomor yang gagal dinormalisasi di-kosongkan dan DICATAT JUMLAHNYA SAJA
  di laporan -- nomornya sendiri TIDAK pernah masuk laporan.
- Output berisi nomor asli -> WAJIB masuk folder scripts/import/output/
  yang di-gitignore. Jangan pernah commit berkas output impor.
- Tanggal lahir TIDAK boleh masuk seed yang ter-commit.
- Nama asli TIDAK boleh masuk seed -- hanya nickname yang di-authorized.

Cara pakai:
  python scripts/import/import_members.py --mode sql    -> cetak SQL INSERT
  python scripts/import/import_members.py --mode report -> cetak ringkasan mapping
  python scripts/import/import_members.py --mode json   -> cetak JSON untuk Supabase API
  python scripts/import/import_members.py --mode sql --output scripts/import/output/import_members.sql

Output ke stdout, supaya bisa diarahkan ke file atau pipe ke psql.
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl belum terinstall: pip install openpyxl")

DB_DIR = Path(__file__).resolve().parent.parent.parent / "database"
XLSX_PATH = DB_DIR / "DATA-PEMUDA_GKKK.xlsx"
SHEET_NAME = "ANGGOTA PEMUDA"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "output"

SKILL_CATEGORIES = {
    "WL": "worship_leader",
    "SINGER": "singer",
    "PEMUSIK": "musician",
    "SOUND": "sound",
    "MULTIMEDIA": "multimedia",
    "USHER": "usher",
}


def normalize_phone(raw):
    """Normalisasi nomor ke format 62... (aturan T1 brief kontak).

    Buang semua non-digit -> 0 di depan jadi 62 -> 62 di depan dibiarkan ->
    +62 jadi 62. Hasil <10 atau >15 digit dianggap bukan nomor -> None.
    Versi mentah sengaja TIDAK disimpan: brief melarang menambah kolom
    yang tidak diminta, dan nilai mentah tak berguna setelah normalisasi.
    """
    if raw is None:
        return None
    digits = re.sub(r"\D", "", str(raw))
    if not digits:
        return None
    if digits.startswith("0"):
        digits = digits[1:]
    if not digits.startswith("62"):
        digits = "62" + digits
    if len(digits) < 10 or len(digits) > 15:
        return None
    return digits


def parse_date(raw):
    """Parse berbagai format tanggal ke ISO date string atau None."""
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw.strftime("%Y-%m-%d")
    s = str(raw).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d %B %Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    match = re.match(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", s)
    if match:
        months = {
            "januari": 1, "februari": 2, "maret": 3, "april": 4,
            "mei": 5, "juni": 6, "juli": 7, "agustus": 8,
            "september": 9, "oktober": 10, "november": 11, "desember": 12,
        }
        day, mon_str, year = match.groups()
        mon = months.get(mon_str.lower())
        if mon:
            return f"{year}-{mon:02d}-{int(day):02d}"
    return None


def parse_skills(raw):
    """Parse bidang pelayanan menjadi list skill category."""
    if not raw:
        return []
    text = str(raw).upper()
    found = []
    for key, value in SKILL_CATEGORIES.items():
        if key in text:
            found.append(value)
    return found


def load_members(path=XLSX_PATH):
    """Baca sheet ANGGOTA PEMUDA, return list of dict."""
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[SHEET_NAME]
    members = []
    for row in ws.iter_rows(min_row=3, max_row=ws.max_row, values_only=True):
        num = row[0]
        if num is None or not isinstance(num, (int, float)):
            continue
        full_name = str(row[1]).strip() if row[1] else ""
        nickname = str(row[2]).strip() if row[2] else full_name
        # row[3] = No. Telepon -- dinormalisasi (T1 brief kontak WhatsApp);
        # yang gagal di-kosongkan dan dihitung di laporan, bukan disalin.
        raw_phone = row[3]
        whatsapp = normalize_phone(raw_phone)
        has_raw = raw_phone is not None and str(raw_phone).strip() != ""
        hometown = str(row[4]).strip() if row[4] else None
        birth_date = parse_date(row[5])
        skills = parse_skills(row[6])
        if not full_name:
            continue
        members.append({
            "num": int(num),
            "full_name": full_name,
            "nickname": nickname,
            "whatsapp": whatsapp,
            "has_raw_phone": has_raw,
            "hometown": hometown,
            "birth_date": birth_date,
            "skills": skills,
        })
    return members


def generate_sql(members):
    """Generate SQL INSERT statements untuk tabel profiles & skills."""
    lines = [
        "-- Generated: " + datetime.now().isoformat(),
        "-- Sumber: DATA-PEMUDA_GKKK.xlsx -> ANGGOTA PEMUDA",
        "-- Jumlah: " + str(len(members)) + " anggota",
        "--",
        "-- CATATAN PRIVASI:",
        "--   - No. telepon sudah DINORMALISASI ke format 62... (T1 brief kontak).",
        "--   - Tanggal lahir ada di sini untuk keperluan internal,",
        "--     TIDAK boleh masuk seed.ts yang ter-commit.",
        "--   - Berkas ini berisi nomor asli: JANGAN commit.",
        "--     Jalankan dengan --output scripts/import/output/ (di-gitignore).",
        "--",
        "-- URUTAN: import_members.sql -> import_cross.sql -> import_finance.sql -> import_events.sql",
        "--",
        "BEGIN;",
        "",
        "-- 1. Profiles (id pakai nomor urut sebagai pseudo-UUID yang deterministik)",
        "--    INSERT ini idempotent: aman diulang.",
    ]
    for m in members:
        fn = m["full_name"].replace("'", "''")
        nn = m["nickname"].replace("'", "''")
        ht = m["hometown"].replace("'", "''") if m["hometown"] else None
        bd = m["birth_date"] or "NULL"
        wa = m["whatsapp"]
        ht_sql = f"'{ht}'" if ht else "NULL"
        bd_sql = f"'{bd}'" if bd != "NULL" else "NULL"
        wa_sql = f"'{wa}'" if wa else "NULL"
        status = "active" if m["num"] <= 93 else "inactive"
        lines.append(
            f"INSERT INTO public.profiles (id, full_name, nickname, birth_date, hometown, whatsapp, status, is_active) "
            f"VALUES ('p{m['num']:03d}', '{fn}', '{nn}', {bd_sql}, {ht_sql}, {wa_sql}, '{status}', true) "
            f"ON CONFLICT (id) DO UPDATE SET "
            f"full_name = EXCLUDED.full_name, nickname = EXCLUDED.nickname, "
            f"birth_date = EXCLUDED.birth_date, hometown = EXCLUDED.hometown, "
            f"whatsapp = EXCLUDED.whatsapp, "
            f"status = EXCLUDED.status, updated_at = now();"
        )
    lines.append("")
    lines.append("-- 2. Skills (hapus dulu yang lama, insert yang baru -- idempotent)")
    for m in members:
        lines.append(
            f"DELETE FROM public.skills WHERE profile_id = 'p{m['num']:03d}';"
        )
        for skill in m["skills"]:
            lines.append(
                f"INSERT INTO public.skills (profile_id, category, skill_name, proficiency_level) "
                f"VALUES ('p{m['num']:03d}', '{skill}', '{skill}', 'intermediate');"
            )
    lines.append("")
    lines.append("COMMIT;")
    return "\n".join(lines)


def generate_json(members):
    """Generate JSON array untuk Supabase API."""
    output = []
    for m in members:
        fn = m["full_name"]
        nn = m["nickname"]
        ht = m["hometown"]
        bd = m["birth_date"]
        status = "active" if m["num"] <= 93 else "inactive"
        output.append({
            "id": f"p{m['num']:03d}",
            "full_name": fn,
            "nickname": nn,
            "birth_date": bd,
            "hometown": ht,
            "whatsapp": m["whatsapp"],
            "status": status,
            "is_active": True,
        })
    return json.dumps(output, ensure_ascii=False, indent=2)


def generate_report(members):
    """Print ringkasan data untuk review Dex."""
    with_phone = sum(1 for m in members if m["whatsapp"])
    # Jumlah saja. Nomor yang gagal TIDAK boleh dicetak di laporan (brief).
    failed_raw = sum(1 for m in members if m["whatsapp"] is None and m["has_raw_phone"])
    print(f"Total anggota: {len(members)}")
    print(f"Dengan nomor WhatsApp tersimpan (ternormalisasi): {with_phone}")
    print(f"Dengan tanggal lahir: {sum(1 for m in members if m['birth_date'])}")
    print(f"Dengan skills: {sum(1 for m in members if m['skills'])}")
    print(f"Dengan hometown: {sum(1 for m in members if m['hometown'])}")
    print(f"Nomor GAGAL dinormalisasi (dikosongkan): {failed_raw}")
    print()
    print("Sample (5 pertama):")
    for m in members[:5]:
        print(f"  {m['num']:3d}. {m['full_name'][:40]:40s} | {m['nickname']:15s} | {m['birth_date'] or 'N/A':10s} | wa: {'OK' if m['whatsapp'] else '-'} | skills: {', '.join(m['skills']) or '-'}")
    print()
    print("Nama duplikat (jika ada):")
    names = [m["nickname"] for m in members]
    seen = set()
    dupes = []
    for n in names:
        if n in seen:
            dupes.append(n)
        seen.add(n)
    if dupes:
        for d in dupes:
            print(f"  - {d}")
    else:
        print("  (tidak ada)")


def has_raw_phone(member):
    """True bila baris sumber berisi nomor namun hasil normalisasi None."""
    return False  # diganti nilai asli saat load: lihat load_members()



def main():
    parser = argparse.ArgumentParser(description="Import anggota pemuda dari Excel")
    parser.add_argument("--mode", choices=["sql", "json", "report"], default="report")
    parser.add_argument(
        "--output",
        help="Output file path (default: scripts/import/output/ -- DI-GITIGNORE)",
    )
    args = parser.parse_args()

    members = load_members()
    if args.mode == "sql":
        output = generate_sql(members)
    elif args.mode == "json":
        output = generate_json(members)
    else:
        generate_report(members)
        return

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output, encoding="utf-8")
        print(f"Output tertulis ke: {out_path}", file=sys.stderr)
    else:
        # stdout biar bisa dipipe ke psql. Kalau mau menyimpan ke berkas,
        # arahkan ke scripts/import/output/ yang DI-GITIGNORE supaya nomor
        # asli tidak pernah ter-commit.
        print(output)


if __name__ == "__main__":
    main()
