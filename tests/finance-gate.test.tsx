import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AppRole } from "@/lib/types";

/**
 * The cash page gates on the server: a role outside FINANCE_ROLES must not
 * even request the ledger. RLS ("Opsi A") is the real wall; this proves the
 * second layer never asks for rows it would only hide.
 */

const state: { role: AppRole | null } = { role: "ministry" };
const getFinanceTransactions = vi.fn(async () => []);
const getEvents = vi.fn(async () => []);

vi.mock("@/lib/data", () => ({
  getMyRole: async () => state.role,
  getFinanceTransactions: () => getFinanceTransactions(),
  getEvents: () => getEvents(),
}));

// Cold import of the page tree is slow on Windows; keep it out of the 5 s test budget.
beforeAll(async () => {
  await import("@/app/dashboard/finance/page");
}, 60_000);

beforeEach(() => {
  getFinanceTransactions.mockClear();
  getEvents.mockClear();
});

describe("FinancePage server gate", () => {
  it("tim ibadah: explains the restriction and fetches no cash data", async () => {
    const { default: FinancePage } = await import("@/app/dashboard/finance/page");
    state.role = "ministry";
    const html = renderToStaticMarkup(await FinancePage());
    expect(html).toContain("Buku kas khusus bendahara dan admin");
    expect(getFinanceTransactions).not.toHaveBeenCalled();
  });

  it("bendahara: loads the ledger", async () => {
    const { default: FinancePage } = await import("@/app/dashboard/finance/page");
    state.role = "treasurer";
    await FinancePage();
    expect(getFinanceTransactions).toHaveBeenCalledTimes(1);
  });

  it("demo mode (role null): full preview", async () => {
    const { default: FinancePage } = await import("@/app/dashboard/finance/page");
    state.role = null;
    await FinancePage();
    expect(getFinanceTransactions).toHaveBeenCalledTimes(1);
  });
});
