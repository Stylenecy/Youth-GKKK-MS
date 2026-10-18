import { describe, expect, it } from "vitest";
import {
  SLOT_NEEDS,
  slotStatus,
  groupStewardCandidates,
  missingSlots,
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

describe("kandidat petugas (masukan Nathan 18 Okt 2026)", () => {
  const base = [
    cand({ id: "a", fullName: "Dian Kusuma", load: 3, rolesServed: ["Pemusik"] }),
    cand({ id: "b", fullName: "Angela Wijaya", load: 0 }),
    cand({ id: "c", fullName: "Samuel", load: null, rolesServed: ["Singer"] }),
    cand({ id: "d", fullName: "Nathan Gunawan", load: 2, rolesServed: ["Pemusik", "WL"] }),
    cand({ id: "e", fullName: "Michael", load: 0 }),
    cand({ id: "f", fullName: "Bima Prameswari", load: 1, rolesServed: ["Pemusik"] }),
  ];
  const ids = (g: ReturnType<typeof groupStewardCandidates>) =>
    g.sections.map((s) => [s.key, s.items.map((r) => r.cand.id)]);

  it("yang pernah memegang peran itu di atas, lalu anggota aktif lain — masing-masing urut abjad", () => {
    expect(ids(groupStewardCandidates(base, "", "Pemusik"))).toEqual([
      ["experienced", ["f", "a", "d"]],
      ["active", ["b", "e", "c"]],
    ]);
  });

  it("tanpa riwayat peran itu, satu bagian saja: Anggota aktif", () => {
    const g = groupStewardCandidates(base, "", "Usher");
    expect(g.sections.map((s) => s.title)).toEqual(["Anggota aktif"]);
    expect(g.sections[0].items.map((r) => r.cand.id)).toEqual(["b", "f", "a", "e", "d", "c"]);
  });

  it("yang sudah bertugas di ibadah itu tidak muncul (satu orang satu peran)", () => {
    const g = groupStewardCandidates(base, "", "Pemusik", new Set(["f", "b"]));
    expect(ids(g)).toEqual([
      ["experienced", ["a", "d"]],
      ["active", ["e", "c"]],
    ]);
  });

  it("terlalu sering bertugas ditandai tapi tetap bisa dipilih", () => {
    const g = groupStewardCandidates(base, "", "Pemusik");
    const heavy = g.sections[0].items.find((r) => r.cand.id === "a")!;
    expect(heavy.overloaded).toBe(true);
    expect(heavy.disabled).toBe(false);
  });

  it("berhalangan disembunyikan (dihitung) tanpa cari, muncul disabled saat dicari", () => {
    const withAway = [
      ...base,
      cand({ id: "z", fullName: "Jonathan Wijaya", status: "away", load: 1 }),
    ];
    const plain = groupStewardCandidates(withAway, "", "Singer");
    expect(plain.hiddenUnavailable).toBe(1);
    expect(plain.sections.flatMap((s) => s.items).some((r) => r.cand.id === "z")).toBe(false);
    const found = groupStewardCandidates(withAway, "jonathan", "Singer");
    expect(ids(found)).toEqual([["unavailable", ["z"]]]);
    expect(found.sections[0].items[0].disabled).toBe(true);
  });

  it("pencarian menyaring nama panggilan dan nama lengkap", () => {
    expect(ids(groupStewardCandidates(base, "wijaya", "Singer"))).toEqual([
      ["active", ["b"]],
    ]);
  });
});

describe("missingSlots (isi berurutan)", () => {
  it("satu entri per slot kosong, urut peran resmi", () => {
    expect(
      missingSlots([
        { role: "WL", status: "assigned" },
        { role: "Singer", status: "assigned" },
        { role: "Singer", status: "replaced" },
        { role: "Pemusik", status: "confirmed" },
        { role: "Multimedia", status: "assigned" },
        { role: "Sound", status: "assigned" },
      ])
    ).toEqual(["Singer", "Usher", "Usher"]);
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
