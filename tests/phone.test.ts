import { describe, it, expect } from "vitest";
import {
  normalizePhoneNumber,
  buildWhatsAppLink,
  getWhatsAppAction,
  canViewContacts,
  FAKE_NUMBER_PREFIX,
} from "@/lib/phone";

describe("normalizePhoneNumber", () => {
  it("strips spaces, dashes and parens from a local number (0812...)", () => {
    expect(normalizePhoneNumber("0812-3456-7890")).toBe("6281234567890");
  });

  it("keeps an already-62 number as-is", () => {
    expect(normalizePhoneNumber("6281234567890")).toBe("6281234567890");
  });

  it("turns +62 into 62", () => {
    expect(normalizePhoneNumber("+62 812-3456-7890")).toBe("6281234567890");
  });

  it("drops the leading 0 from a 08xx number", () => {
    expect(normalizePhoneNumber("0812 3456 7890")).toBe("6281234567890");
  });

  it("normalizes the seed's raw fake numbers into the reserved block", () => {
    expect(normalizePhoneNumber("6280000-101-23")).toBe("628000010123");
    expect(normalizePhoneNumber("+62 80000-456-78")).toBe("628000045678");
    expect(normalizePhoneNumber("6280000-101-23")?.startsWith(FAKE_NUMBER_PREFIX)).toBe(true);
  });

  it("rejects a number with no digits", () => {
    expect(normalizePhoneNumber("belum ada")).toBeNull();
  });

  it("rejects a number that is too short to be a real phone", () => {
    expect(normalizePhoneNumber("0812")).toBeNull();
  });

  it("rejects null and undefined input", () => {
    expect(normalizePhoneNumber(null)).toBeNull();
    expect(normalizePhoneNumber(undefined)).toBeNull();
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link from the normalized form", () => {
    expect(buildWhatsAppLink("0812-3456-7890")).toBe("https://wa.me/6281234567890");
  });

  it("returns null when the number is invalid", () => {
    expect(buildWhatsAppLink("bukan nomor")).toBeNull();
    expect(buildWhatsAppLink(null)).toBeNull();
  });
});

describe("getWhatsAppAction (what the button renders)", () => {
  it("returns a link with a name-labeled aria text", () => {
    const action = getWhatsAppAction("0812-3456-7890", "Wangke");
    expect(action?.href).toBe("https://wa.me/6281234567890");
    expect(action?.label).toBe("Chat via WhatsApp dengan Wangke");
  });

  it("returns null when the number is missing — the button renders nothing", () => {
    expect(getWhatsAppAction(null, "Angel")).toBeNull();
    expect(getWhatsAppAction("0812", "Angel")).toBeNull();
  });
});

describe("canViewContacts (role gate)", () => {
  it("admits the pengurus inti + tim ibadah roles", () => {
    for (const role of ["admin", "treasurer", "leader", "ministry"]) {
      expect(canViewContacts(role), role).toBe(true);
    }
  });

  it("excludes members, strangers and missing roles", () => {
    expect(canViewContacts("member")).toBe(false);
    expect(canViewContacts(null)).toBe(false);
    expect(canViewContacts(undefined)).toBe(false);
  });
});
