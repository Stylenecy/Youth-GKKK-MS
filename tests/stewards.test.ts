import { describe, expect, it } from "vitest";
import {
  SLOT_NEEDS,
  slotStatus,
  sortStewardCandidates,
  serviceReadiness,
  type StewardCandidate,
} from "../src/lib/stewards";

function cand(
 over: Partial<StewardCandidate> & { id: string; fullName: string }
): StewardCandidate {
  return {
    nickname: over.fullName.split(" ")[0] ?? over.fullName,
    status: "active",
    load: 0,
    crossLabel: "—",
    ...over,
  };
}

describe("kebutuhan slot per peran (Dex 29 Sep 2026)", () => {
  it("WL/Multimedia/Sound 1, Singer/Usher 2, Pemusik min 1 maks bebas", () => {
    expect(SLOT_NEEDS).toMatchObject({
      WL: { min: 1, max: 1 },
      Singer: { min: 2, max: 2 },
      Pemusik: { min: 1, max: null },
      Multimedia: { min: 1, max: 1 },
      Sound: { min: 1, max: 1 },
      Usher: { min: 2, max: 2 },
    });
  });

  it("slotStatus: kosong/sebagian/lengkap/lebih", () => {
    expect(slotStatus("Singer", 0)).toMatchObject({
      head: "Singer 0/2",
      sub: "Kurang 2",
      tone: "empty",
    });
    expect(slotStatus("Singer", 1)).toMatchObject({
      head: "Singer 1/2",
      sub: "Kurang 1",
      tone: "partial",
    });
    expect(slotStatus("Singer", 2)).toMatchObject({
      head: "Singer 2/2",
      sub: "Lengkap",
      tone: "full",
    });
    expect(slotStatus("Singer", 3)).toMatchObject({
      head: "Singer 3/2",
      sub: "Lebih 1",
      tone: "over",
    });
  });

  it("Pemusik tanpa batas atas: Kurang di bawah min, Cukup di atasnya", () => {
    expect(slotStatus("Pemusik", 0)).toMatchObject({
      head: "Pemusik 0",
      sub: "Kurang 1",
      tone: "empty",
    });
    expect(slotStatus("Pemusik", 1)).toMatchObject({
      head: "Pemusik 1",
      sub: "Cukup",
      tone: "full",
    });
    expect(slotStatus("Pemusik", 4)).toMatchObject({
      head: "Pemusik 4",
      sub: "Cukup",
      tone: "full",
    });
  });
});

describe("urutan kandidat (spek IMK 29 Sep 2026)", () => {
  const base = [
    cand({ id: "a", fullName: "Dian Kusuma", load: 3 }),
    cand({ id: "b", fullName: "Angela Wijaya", load: 0 }),
    cand({ id: "c", fullName: "Samuel", load: null }),
    cand({ id: "d", fullName: "Nathan Gunawan", load: 2 }),
    cand({ id: "e", fullName: "Michael", load: 0 }),
    cand({ id: "f", fullName: "Dian Prameswari", load: 1 }),
  ];

  it("ringan-dulu, tak-dikenal, overload terakhir; alfabet seri", () => {
    const ids = sortStewardCandidates(base, "").map((r) => r.cand.id);
    expect(ids).toEqual(["b", "e", "f", "d", "c", "a"]);
  });

  it("overload ditandai tapi tidak disabled", () => {
    const rows = sortStewardCandidates(base, "");
    const heavy = rows.find((r) => r.cand.id === "a")!;
    expect(heavy.overloaded).toBe(true);
    expect(heavy.disabled).toBe(false);
  });

  it("away disembunyikan tanpa cari, muncul disabled saat dicari", () => {
    const withAway = [
      ...base,
      cand({ id: "z", fullName: "Jonathan Wijaya", status: "away", load: 1 }),
    ];
    expect(
      sortStewardCandidates(withAway, "").some((r) => r.cand.id === "z")
    ).toBe(false);
    const found = sortStewardCandidates(withAway, "jonathan");
    expect(found.map((r) => r.cand.id)).toEqual(["z"]);
    expect(found[0].disabled).toBe(true);
  });

  it("saat mencari, cocok-nama menang atas beban", () => {
    const rows = sortStewardCandidates(base, "dian");
    expect(rows.map((r) => r.cand.id)).toEqual(["f", "a"]);
  });
});

describe("serviceReadiness", () => {
  const s = (role: string, status = "assigned") => ({ role, status });

  it("counts 8 minimum slots for an empty Saturday", () => {
    const r = serviceReadiness([]);
    expect(r.needed).toBe(8);
    expect(r.filled).toBe(0);
    expect(r.missing.map((m) => m.role)).toEqual([
      "WL", "Singer", "Pemusik", "Multimedia", "Sound", "Usher",
    ]);
  });

  it("does not let extra musicians cover a missing usher", () => {
    const r = serviceReadiness([
      s("WL"), s("Singer"), s("Singer"), s("Pemusik"), s("Pemusik"), s("Pemusik"),
      s("Multimedia"), s("Sound"),
    ]);
    expect(r.filled).toBe(6);
    expect(r.missing).toEqual([{ role: "Usher", count: 2 }]);
  });

  it("ignores replaced rows and roles outside the official list", () => {
    const r = serviceReadiness([s("WL", "replaced"), s("Musik")]);
    expect(r.filled).toBe(0);
  });
});
