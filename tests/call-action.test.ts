import { describe, it, expect, vi } from "vitest";
import { callAction, NETWORK_ERROR } from "../src/lib/call-action";

describe("callAction (R6 #7)", () => {
  it("passes a normal result through untouched", async () => {
    const res = await callAction(async () => ({ success: false, error: "ditolak" }));
    expect(res).toEqual({ success: false, error: "ditolak" });
  });

  it("turns a thrown action into a failure every component can show", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await callAction<{ success: boolean; error?: string; errors?: { form?: string[] } }>(
      async () => {
        throw new TypeError("Failed to fetch");
      }
    );
    expect(res.success).toBe(false);
    expect(res.error).toBe(NETWORK_ERROR);
    expect(res.errors?.form?.[0]).toBe(NETWORK_ERROR);
    spy.mockRestore();
  });

  it("a thrown import carries no row list — forms must not index it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await callAction<{ success: boolean; errors: unknown }>(async () => {
      throw new Error("timeout");
    });
    // BulkImportTransactionsForm guards with Array.isArray for exactly this.
    expect(Array.isArray(res.errors)).toBe(false);
    spy.mockRestore();
  });
});
