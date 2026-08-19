#!/usr/bin/env python3
"""
Import data Cross dari Data Cross.md (Skema 1) ke format SQL INSERT.

Mapping Skema 1:
  Cross 1 -> c1 (Erica, Cece, Wynne, Nita, Grace, Ella, Echa, Faith, EnEn, Nissi)
  Cross 2 -> c2 (Wangke, Arion, Cecil, Quinn, Ding Ding, Valen, Marel, Ayu, Lala, Jean, Jocelyn)
  Cross 3 -> c3 (Dex, Ben, Yeri, Olvan, Jolex, Marvel)
  Cross 4 -> c4 (Nathan, Michael, Candra, Samuel)
  Cross 5 -> c5 (Angel, Aeryn, Ivana, Gizandra, Heidi, Dian, Eileen, Celina)

Cross Leader ditandai hijau di Data Cross.md:
  C1: Erica
  C2: Wangke
  C3: Dex
  C4: Nathan
  C5: Angel

Cara pakai:
  python scripts/import/import_cross.py --mode sql    -> cetak SQL INSERT
  python scripts/import/import_cross.py --mode report -> cetak ringkasan
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from id_map import pid

SKEMA_1 = {
    "c1": {
        "name": "Cross 1",
        "leader": "Erica",
        "members": ["Erica", "Cece", "Wynne", "Nita", "Grace", "Ella", "Echa", "Faith", "EnEn", "Nissi"],
    },
    "c2": {
        "name": "Cross 2",
        "leader": "Wangke",
        "members": ["Wangke", "Arion", "Cecil", "Quinn", "Ding Ding", "Valen", "Marel", "Ayu", "Lala", "Jean", "Jocelyn"],
    },
    "c3": {
        "name": "Cross 3",
        "leader": "Dex",
        "members": ["Dex", "Ben", "Yeri", "Olvan", "Jolex", "Marvel"],
    },
    "c4": {
        "name": "Cross 4",
        "leader": "Nathan",
        "members": ["Nathan", "Michael", "Candra", "Samuel"],
    },
    "c5": {
        "name": "Cross 5",
        "leader": "Angel",
        "members": ["Angel", "Aeryn", "Ivana", "Gizandra", "Heidi", "Dian", "Eileen", "Celina"],
    },
}

NICKNAME_TO_CROSS = {}
for cross_id, info in SKEMA_1.items():
    for member_name in info["members"]:
        NICKNAME_TO_CROSS[member_name] = cross_id


def generate_sql():
    """Generate SQL INSERT untuk crosses dan cross_memberships."""
    lines = [
        "-- Generated: " + datetime.now().isoformat(),
        "-- Sumber: Data Cross.md -> Skema 1",
        "-- Jumlah: 5 Cross groups, 39 anggota",
        "--",
        "BEGIN;",
        "",
        "-- 1. Cross groups",
    ]
    for cross_id, info in SKEMA_1.items():
        name = info["name"]
        row_id = pid(cross_id)
        lines.append(
            f"INSERT INTO public.crosses (id, name, meeting_day, meeting_time, is_active) "
            f"VALUES ('{row_id}', '{name}', 'Sabtu', '19:00', true) "
            f"ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();"
        )
    lines.append("")
    lines.append("-- 2. Cross memberships (leader + members)")
    for cross_id, info in SKEMA_1.items():
        row_id = pid(cross_id)
        leader = info["leader"]
        lines.append(
            f"INSERT INTO public.cross_memberships (profile_id, cross_id, role, start_date, is_active) "
            f"SELECT id, '{row_id}', 'leader', '2026-07-11T00:00:00Z', true "
            f"FROM public.profiles WHERE nickname = '{leader}' "
            f"ON CONFLICT DO NOTHING;"
        )
        for member in info["members"]:
            if member == leader:
                continue
            lines.append(
                f"INSERT INTO public.cross_memberships (profile_id, cross_id, role, start_date, is_active) "
                f"SELECT id, '{row_id}', 'member', '2026-07-11T00:00:00Z', true "
                f"FROM public.profiles WHERE nickname = '{member}' "
                f"ON CONFLICT DO NOTHING;"
            )
    lines.append("")
    lines.append("COMMIT;")
    return "\n".join(lines)


def generate_report():
    """Print ringkasan Cross groups."""
    print("Skema 1 - 5 Cross Groups")
    print("=" * 50)
    total = 0
    for cross_id, info in SKEMA_1.items():
        n = len(info["members"])
        total += n
        print(f"\n{info['name']} ({n} anggota)")
        print(f"  Leader: {info['leader']}")
        others = [m for m in info["members"] if m != info["leader"]]
        print(f"  Anggota: {', '.join(others)}")
    print(f"\nTotal anggota terkelompokkan: {total}")
    print(f"\nAnggota di luar Skema 1: {93 - total} (status: kuliah/tinggal di luar kota/negeri, pindah gereja, lulus, atau belum aktif)")


def main():
    parser = argparse.ArgumentParser(description="Import Cross groups dari Data Cross.md")
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
