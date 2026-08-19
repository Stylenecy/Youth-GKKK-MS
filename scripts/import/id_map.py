"""
Deterministic UUID mapping untuk pseudo-id yang dipakai antar generator impor
(p001, c1, e001, s0001, dst).

Kenapa ada ini: kolom `id` di semua tabel Supabase (profiles, crosses, events,
steward_assignments) bertipe `uuid`, bukan `text` -- pseudo-id pendek seperti
'p001' gagal di-cast Postgres (`invalid input syntax for type uuid`).
uuid5 dipilih (bukan uuid4/random) supaya pseudo-id yang sama SELALU
menghasilkan uuid yang sama di setiap regenerasi -- itu yang bikin
`ON CONFLICT (id) DO UPDATE` di seluruh generator tetap idempotent.

NAMESPACE ini konstan permanen -- jangan pernah diubah, atau semua id yang
sudah tertanam di DB produksi akan mismatch dengan hasil generate berikutnya.
"""

import uuid

# Konstan permanen -- generated once, never regenerate.
_NAMESPACE = uuid.UUID("a17c1a9e-8f2b-4a3d-9c11-8f2b4a3d9c11")


def pid(pseudo_id: str) -> str:
    """Ubah pseudo-id ('p001', 'c1', 'e001', 's0001') jadi UUID deterministik."""
    return str(uuid.uuid5(_NAMESPACE, pseudo_id))
