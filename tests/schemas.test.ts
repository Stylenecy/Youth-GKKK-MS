import { describe, it, expect } from "vitest";
import { eventSchema, financeSchema } from "@/lib/schemas";

const validEvent = {
  date: "2026-08-08",
  time: "17:00",
  weeklyTheme: "Unchained, Not Unchecked",
  eventType: "worship",
  picId: "1",
  speakerName: "Pembicara Tamu",
  description: "",
};

describe("eventSchema", () => {
  it("accepts a well-formed event", () => {
    expect(eventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("treats time as optional so existing forms keep working", () => {
    const { time, ...withoutTime } = validEvent;
    void time;
    expect(eventSchema.safeParse(withoutTime).success).toBe(true);
    expect(eventSchema.safeParse({ ...validEvent, time: "" }).success).toBe(true);
  });

  it("rejects a malformed time", () => {
    const result = eventSchema.safeParse({ ...validEvent, time: "5pm" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown event type", () => {
    const result = eventSchema.safeParse({ ...validEvent, eventType: "concert" });
    expect(result.success).toBe(false);
  });

  it("requires a date, a theme and a PIC", () => {
    for (const field of ["date", "weeklyTheme", "picId"] as const) {
      const result = eventSchema.safeParse({ ...validEvent, [field]: "" });
      expect(result.success, `${field} should be required`).toBe(false);
    }
  });
});

const validTransaction = {
  amount: "150000",
  type: "income",
  account: "kas_kecil",
  category: "persembahan_pemuda",
  description: "Persembahan QRIS pemuda",
  eventId: "",
};

describe("financeSchema", () => {
  it("coerces a form string amount to a number", () => {
    const result = financeSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(150000);
  });

  it("rejects zero and negative amounts", () => {
    for (const amount of ["0", "-5000"]) {
      const result = financeSchema.safeParse({ ...validTransaction, amount });
      expect(result.success, `amount ${amount} should be rejected`).toBe(false);
    }
  });

  it("rejects an unknown transaction type", () => {
    const result = financeSchema.safeParse({
      ...validTransaction,
      type: "refund",
    });
    expect(result.success).toBe(false);
  });

  it("requires a description of at least 3 characters", () => {
    const result = financeSchema.safeParse({
      ...validTransaction,
      description: "ok",
    });
    expect(result.success).toBe(false);
  });
});
