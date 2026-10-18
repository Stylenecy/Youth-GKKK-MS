import { isOverloaded } from "./fatigue";
import { STEWARD_ROLES, type StewardRole } from "./validation";

export interface SlotNeed {
  /** Minimal tampil "Kurang n" di bawah ini. */
  min: number;
  /** null = tak terbatas (Pemusik 2–4 tergantung acara & siapa bisa). */
  max: number | null;
}

/**
 * Kebutuhan orang per peran per Sabtu — konfigurasi aplikasi, BUKAN kolom
 * DB (kebutuhan mingguan stabil, tak layak jadi skema). Angka dari Dex:
 * WL 1, Singer 2, Pemusik min 1 / maks tak terbatas, Multimedia 1,
 * Sound 1, Usher 2 (29 Sep 2026).
 */
export const SLOT_NEEDS: Record<StewardRole, SlotNeed> = {
  WL: { min: 1, max: 1 },
  Singer: { min: 2, max: 2 },
  Pemusik: { min: 1, max: null },
  Multimedia: { min: 1, max: 1 },
  Sound: { min: 1, max: 1 },
  Usher: { min: 2, max: 2 },
};

export type SlotTone = "empty" | "partial" | "full" | "over";

export interface SlotStatus {
  head: string;
  sub: string;
  tone: SlotTone;
}

/**
 * "Singer 1/2 · Kurang 1" — angka x/y + kata kerja, tanpa hitungan mental.
 * Belum lengkap = aksen emas (mudah dipindai); overload individu tetap
 * maroon — jangan jadikan semua kekurangan merah supaya alarm penting
 * tidak tenggelam.
 */
export function slotStatus(
  role: StewardRole,
  filled: number,
  need: SlotNeed = SLOT_NEEDS[role]
): SlotStatus {
  if (need.max === null) {
    // Tanpa batas atas: "Pemusik 3 · Cukup".
    if (filled < need.min)
      return {
        head: `${role} ${filled}`,
        sub: `Kurang ${need.min - filled}`,
        tone: filled <= 0 ? "empty" : "partial",
      };
    return { head: `${role} ${filled}`, sub: "Cukup", tone: "full" };
  }
  if (filled <= 0)
    return { head: `${role} 0/${need.max}`, sub: `Kurang ${need.max}`, tone: "empty" };
  if (filled < need.max)
    return {
      head: `${role} ${filled}/${need.max}`,
      sub: `Kurang ${need.max - filled}`,
      tone: "partial",
    };
  if (filled === need.max)
    return { head: `${role} ${filled}/${need.max}`, sub: "Lengkap", tone: "full" };
  return {
    head: `${role} ${filled}/${need.max}`,
    sub: `Lebih ${filled - need.max}`,
    tone: "over",
  };
}

export interface StewardCandidate {
  id: string;
  nickname: string;
  fullName: string;
  /** "active" | "away" | ... — hanya active yang bisa dipilih. */
  status: string;
  /** null = data beban benar-benar tak tersedia (bedakan dari 0×!). */
  load: number | null;
  crossLabel: string;
  /** Peran yang pernah dipegangnya (riwayat penatalayan). */
  rolesServed?: string[];
}

export interface RankedCandidate {
  cand: StewardCandidate;
  /** true = baris tampil tapi tak bisa ditekan (berhalangan, hasil cari). */
  disabled: boolean;
  overloaded: boolean;
}

export interface CandidateSection {
  key: "experienced" | "active" | "unavailable";
  title: string;
  items: RankedCandidate[];
}

export interface CandidateGroups {
  sections: CandidateSection[];
  /** Berhalangan / tidak aktif yang disembunyikan karena tidak sedang dicari. */
  hiddenUnavailable: number;
}

function matches(c: StewardCandidate, q: string): boolean {
  const hay = `${c.nickname} ${c.fullName}`.toLowerCase();
  return hay.includes(q);
}

function byName(a: StewardCandidate, b: StewardCandidate): number {
  return (
    a.nickname.localeCompare(b.nickname, "id", { sensitivity: "base" }) ||
    a.fullName.localeCompare(b.fullName, "id", { sensitivity: "base" })
  );
}

function rank(cand: StewardCandidate, disabled = false): RankedCandidate {
  return {
    cand,
    disabled,
    overloaded: !disabled && cand.load !== null && isOverloaded(cand.load),
  };
}

/**
 * Kandidat petugas untuk satu peran di satu ibadah (masukan Nathan via Dex,
 * 18 Okt 2026 — menggantikan urutan "beban paling ringan dulu" 29 Sep):
 *
 * - Yang sudah bertugas di ibadah itu tidak muncul sama sekali — satu orang
 *   satu peran per hari (database menolaknya juga, migrasi 0025).
 * - Bagian 1 "Pernah jadi <peran>": anggota aktif yang pernah memegang peran
 *   itu, jadi pemusik/WL yang memang bisa langsung kelihatan di atas.
 * - Bagian 2: anggota aktif lainnya.
 * - Keduanya urut abjad nama panggilan; beban 30 hari tetap tampil dan yang
 *   terlalu sering tetap ditandai (bukan diblokir).
 * - Berhalangan / tidak aktif disembunyikan, kecuali sedang dicari namanya —
 *   lalu tampil di bawah, tidak bisa dipilih.
 */
export function groupStewardCandidates(
  cands: StewardCandidate[],
  rawQuery: string,
  role: string,
  servingIds: ReadonlySet<string> = new Set()
): CandidateGroups {
  const q = rawQuery.trim().toLowerCase();
  const pool = cands.filter((c) => !servingIds.has(c.id) && (!q || matches(c, q)));
  const active = pool.filter((c) => c.status === "active").sort(byName);
  const unavailable = pool.filter((c) => c.status !== "active").sort(byName);

  const experienced = active.filter((c) => c.rolesServed?.includes(role));
  const others = active.filter((c) => !c.rolesServed?.includes(role));

  const sections: CandidateSection[] = [];
  if (experienced.length > 0) {
    sections.push({
      key: "experienced",
      title: `Pernah jadi ${role}`,
      items: experienced.map((c) => rank(c)),
    });
  }
  if (others.length > 0) {
    sections.push({
      key: "active",
      title: experienced.length > 0 ? "Anggota aktif lain" : "Anggota aktif",
      items: others.map((c) => rank(c)),
    });
  }
  if (q && unavailable.length > 0) {
    sections.push({
      key: "unavailable",
      title: "Berhalangan / tidak aktif",
      items: unavailable.map((c) => rank(c, true)),
    });
  }
  return { sections, hiddenUnavailable: q ? 0 : unavailable.length };
}

/** Slot kosong satu Sabtu, satu per baris, urut peran resmi — antrean
 *  "Isi berurutan" di HP. */
export function missingSlots(
  stewards: { role: string; status: string }[]
): StewardRole[] {
  return serviceReadiness(stewards).missing.flatMap((m) =>
    Array.from({ length: m.count }, () => m.role)
  );
}

export interface Readiness {
  /** Slot terisi, dihitung per peran sampai batas minimalnya. */
  filled: number;
  /** Total slot minimal satu Sabtu (jumlah SLOT_NEEDS[*].min). */
  needed: number;
  /** Peran yang belum cukup, urut STEWARD_ROLES. */
  missing: { role: StewardRole; count: number }[];
}

/**
 * Kesiapan satu ibadah untuk beranda. Dulu meter membagi jumlah orang
 * dengan angka 6 — tiga Pemusik + nol Usher terbaca "lengkap". Sekarang
 * kelebihan di satu peran tidak menutup kekurangan di peran lain, dan
 * peran di luar daftar resmi tidak ikut terhitung.
 */
export function serviceReadiness(
  stewards: { role: string; status: string }[]
): Readiness {
  const counts = new Map<string, number>();
  for (const s of stewards) {
    if (s.status === "replaced") continue;
    counts.set(s.role, (counts.get(s.role) ?? 0) + 1);
  }
  let filled = 0;
  let needed = 0;
  const missing: Readiness["missing"] = [];
  for (const role of STEWARD_ROLES) {
    const need = SLOT_NEEDS[role].min;
    const have = counts.get(role) ?? 0;
    needed += need;
    filled += Math.min(have, need);
    if (have < need) missing.push({ role, count: need - have });
  }
  return { filled, needed, missing };
}
