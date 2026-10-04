import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Reads in lib/data.ts must surface database failures instead of turning
 * them into empty lists (audit 19 Sep + 4 Okt 2026). Exercised against a
 * fake Supabase client — env values are dummies, nothing reaches a database.
 */

const cfg: { result: { data: unknown; error: unknown } } = {
  result: { data: [], error: null },
};

/** Chainable stand-in for the PostgREST query builder. */
function query() {
  const q: Record<string, unknown> = {};
  for (const m of ["select", "eq", "is", "order", "in", "gte", "neq", "limit"]) {
    q[m] = () => q;
  }
  q.single = () => q;
  q.then = (resolve: (v: unknown) => unknown) => resolve(cfg.result);
  return q;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    rpc: async () => cfg.result,
    from: () => query(),
  }),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "dummy-anon-key");
  cfg.result = { data: [], error: null };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("data reads surface failures", () => {
  it("a refused list read throws instead of returning []", async () => {
    const { getEvents, getFinanceTransactions, getProfiles } = await import("@/lib/data");
    cfg.result = { data: null, error: { message: "permission denied" } };
    await expect(getEvents()).rejects.toThrow(/Gagal memuat daftar ibadah/);
    await expect(getFinanceTransactions()).rejects.toThrow(/Gagal memuat buku kas/);
    await expect(getProfiles()).rejects.toThrow(/Gagal memuat/);
  }, 30_000);

  it("an empty answer is still a normal empty list", async () => {
    const { getEvents } = await import("@/lib/data");
    cfg.result = { data: [], error: null };
    await expect(getEvents()).resolves.toEqual([]);
  });

  it(".single() with no row (PGRST116) means 'not found', not a failure", async () => {
    const { getEventById, getMeetingById } = await import("@/lib/data");
    cfg.result = { data: null, error: { code: "PGRST116", message: "0 rows" } };
    await expect(getEventById("x")).resolves.toBeUndefined();
    await expect(getMeetingById("x")).resolves.toBeUndefined();
  });

  it(".single() with a real error throws", async () => {
    const { getEventById } = await import("@/lib/data");
    cfg.result = { data: null, error: { code: "42501", message: "permission denied" } };
    await expect(getEventById("x")).rejects.toThrow(/Gagal memuat ibadah/);
  });
});
