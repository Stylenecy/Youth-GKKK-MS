#!/usr/bin/env python3
"""
Import transaksi keuangan terverifikasi dari DATABASE_FINANCE.md.

Hanya transaksi dengan jumlah & tanggal yang jelas yang di-import.
Transaksi ambigu ("~Rp250.000", "variatif") di-skip dengan catatan.

Kategori mapping (sesuai src/lib/finance.ts):
  - persembahan_pemuda
  - viatikum
  - konsumsi
  - hadiah
  - transport
  - donasi
  - lainnya

Cara pakai:
  python scripts/import/import_finance.py --mode sql    -> cetak SQL INSERT
  python scripts/import/import_finance.py --mode report -> cetak ringkasan
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

VERIFIED_TRANSACTIONS = [
    {
        "date": "2025-01-01",
        "amount": 175000,
        "type": "expense",
        "account": "kas_kecil",
        "category": "hadiah",
        "description": "Tas Ci Sasa (kenang-kenangan)",
        "recorded_by": "Angel",
    },
    {
        "date": "2025-01-01",
        "amount": 176000,
        "type": "expense",
        "account": "kas_kecil",
        "category": "konsumsi",
        "description": "Roti konsumsi (25 pc)",
        "recorded_by": "Ayu",
    },
    {
        "date": "2025-01-01",
        "amount": 250000,
        "type": "expense",
        "account": "kas_kecil",
        "category": "viatikum",
        "description": "Viatikum Pak Gerald",
        "recorded_by": "Angel",
    },
    {
        "date": "2025-01-26",
        "amount": 350000,
        "type": "expense",
        "account": "kas_kecil",
        "category": "transport",
        "description": "Bensin Ko Yudha (survey retreat)",
        "recorded_by": "Nathan",
    },
    {
        "date": "2025-02-01",
        "amount": 230125,
        "type": "income",
        "account": "kas_besar",
        "category": "donasi",
        "description": "Donasi kursi Chitose",
        "recorded_by": "Valen",
    },
]

SKIPPED_TRANSACTIONS = [
    {"reason": "Jumlah tidak pasti (~Rp250.000)", "desc": "Talkshow Pak Sulaiman & Pak Billy"},
    {"reason": "Jumlah tidak pasti", "desc": "Konsumsi Cross (donat 26 bh)"},
    {"reason": "Tanggal tidak jelas (Des 2024)", "desc": "Kado outer Ko Yudha Rp400rb"},
    {"reason": "Tanggal tidak jelas (2026)", "desc": "Hadiah pengurus lama"},
    {"reason": "Jumlah variatif", "desc": "Kas kecil sisa"},
]


def generate_sql():
    """Generate SQL INSERT untuk finance_transactions."""
    lines = [
        "-- Generated: " + datetime.now().isoformat(),
        "-- Sumber: DATABASE_FINANCE.md (transaksi terverifikasi dari chat)",
        "-- Jumlah: " + str(len(VERIFIED_TRANSACTIONS)) + " transaksi",
        "--",
        "-- Transaksi yang DI-SKIP (data ambigu):",
    ]
    for s in SKIPPED_TRANSACTIONS:
        lines.append(f"--   - {s['desc']} ({s['reason']})")
    lines += [
        "",
        "BEGIN;",
        "",
    ]
    for i, t in enumerate(VERIFIED_TRANSACTIONS, 1):
        desc = t["description"].replace("'", "''")
        recorded = t["recorded_by"]
        lines.append(
            f"INSERT INTO public.finance_transactions "
            f"(event_id, amount, type, account, category, description, recorded_by, created_at) "
            f"SELECT NULL, {t['amount']}, '{t['type']}', '{t['account']}', "
            f"'{t['category']}', '{desc}', id, '{t['date']}T00:00:00Z' "
            f"FROM public.profiles WHERE nickname = '{recorded}' "
            f"ON CONFLICT DO NOTHING;"
        )
    lines.append("")
    lines.append("COMMIT;")
    return "\n".join(lines)


def generate_report():
    """Print ringkasan transaksi."""
    print(f"Transaksi terverifikasi: {len(VERIFIED_TRANSACTIONS)}")
    print(f"Transaksi di-skip: {len(SKIPPED_TRANSACTIONS)}")
    print()
    total_in = sum(t["amount"] for t in VERIFIED_TRANSACTIONS if t["type"] == "income")
    total_out = sum(t["amount"] for t in VERIFIED_TRANSACTIONS if t["type"] == "expense")
    print(f"Total pemasukan: Rp{total_in:,}")
    print(f"Total pengeluaran: Rp{total_out:,}")
    print(f"Saldo: Rp{total_in - total_out:,}")
    print()
    print("Detail transaksi:")
    for t in VERIFIED_TRANSACTIONS:
        sign = "+" if t["type"] == "income" else "-"
        print(f"  {t['date']}  {sign}Rp{t['amount']:>10,}  {t['description'][:40]}")
    print()
    print("Transaksi di-skip:")
    for s in SKIPPED_TRANSACTIONS:
        print(f"  - {s['desc']} ({s['reason']})")


def main():
    parser = argparse.ArgumentParser(description="Import transaksi keuangan terverifikasi")
    parser.add_argument("--mode", choices=["sql", "report"], default="report")
    parser.add_argument("--output", help="Output file path (default: stdout)")
    args = parser.parse_args()

    if args.mode == "sql":
        output = generate_sql()
        if args.output:
            Path(args.output).write_text(output, encoding="utf-8")
            print(f"Output tertulis ke: {args.output}", file=sys.stderr)
        else:
            print(output)
    else:
        generate_report()


if __name__ == "__main__":
    main()
