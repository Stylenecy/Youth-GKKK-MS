import { isOverloaded } from "./fatigue";
import type { StewardRole } from "./validation";

/**
 * Kebutuhan orang per peran per Sabtu — konfigurasi aplikasi, BUKAN kolom
 * DB (kebutuhan mingguan stabil, tak layak jadi skema). Angka dari Dex
 * 29 Sep 2026: Pemusik 2–4 tergantung acara (piano/gitar/bass/drum) dan
 * siapa bisa — target 2, lebihnya BOLEH dan dilabeli "Lebih n", tak diblok.
 */
export const SLOT_NEEDS: Record<StewardRole, number> = {
  WL: 1,
  Singer: 2,
  Pemusik: 2,
  Multimedia: 1,
  Sound: 1,
  Usher: 2,
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
  need: number = SLOT_NEEDS[role]
): SlotStatus {
  if (filled <= 0)
    return { head: `${role} 0/${need}`, sub: `Kurang ${need}`, tone: "empty" };
  if (filled < need)
    return {
      head: `${role} ${filled}/${need}`,
      sub: `Kurang ${need - filled}`,
      tone: "partial",
    };
  if (filled === need)
    return { head: `${role} ${filled}/${need}`, sub: "Lengkap", tone: "full" };
  return {
    head: `${role} ${filled}/${need}`,
    sub: `Lebih ${filled - need}`,
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
}

export interface RankedCandidate {
  cand: StewardCandidate;
  /** true = baris tampil tapi tak bisa ditekan (away hasil pencarian). */
  disabled: boolean;
  overloaded: boolean;
}

function matches(c: StewardCandidate, q: string): boolean {
  const hay = `${c.nickname} ${c.fullName}`.toLowerCase();
  return hay.includes(q);
}

function byLoadThenName(a: StewardCandidate, b: StewardCandidate): number {
  return (a.load ?? Infinity) - (b.load ?? Infinity) ||
    a.fullName.localeCompare(b.fullName, "id");
}

/**
 * Urutan kandidat (spek IMK 29 Sep 2026):
 * - Tanpa cari: aktif ringan (beban naik, alfabet) → beban tak dikenal →
 *   overload (beban naik) → away disembunyikan.
 * - Dengan cari: maksud eksplisit menang — cocok nama → aktif → beban →
 *   alfabet; away yang cocok menempel di bawah sebagai disabled.
 */
export function sortStewardCandidates(
  cands: StewardCandidate[],
  rawQuery: string
): RankedCandidate[] {
  const q = rawQuery.trim().toLowerCase();
  if (q) {
    const hit = cands.filter((c) => matches(c, q));
    const active = hit
      .filter((c) => c.status === "active")
      .sort(byLoadThenName);
    const away = hit
      .filter((c) => c.status !== "active")
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "id"));
    return [
      ...active.map((cand) => ({
        cand,
        disabled: false,
        overloaded: cand.load !== null && isOverloaded(cand.load),
      })),
      ...away.map((cand) => ({ cand, disabled: true, overloaded: false })),
    ];
  }
  const active = cands.filter((c) => c.status === "active");
  const light = active
    .filter((c) => c.load === null || !isOverloaded(c.load))
    .sort(byLoadThenName);
  // null (tak dikenal) di atas overload: byLoadThenName menaruh null
  // (Infinity) setelah angka 0–2 tapi sebelum... tidak — Infinity > 3.
  // Pisahkan eksplisit supaya urutannya: ringan → tak dikenal → overload.
  const known = light.filter((c) => c.load !== null);
  const unknown = light.filter((c) => c.load === null);
  const heavy = active
    .filter((c) => c.load !== null && isOverloaded(c.load))
    .sort(byLoadThenName);
  return [...known, ...unknown, ...heavy].map((cand) => ({
    cand,
    disabled: false,
    overloaded: cand.load !== null && isOverloaded(cand.load),
  }));
}
