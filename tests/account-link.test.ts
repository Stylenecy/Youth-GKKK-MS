import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * S19 (migration 0023): which member a login acts as, and who did what in
 * the audit trail. Fake Supabase client answering per table / RPC.
 */

type Res = { data: unknown; error: null };
const fx: { tables: Record<string, Res>; rpc: Record<string, Res>; eqs: { table: string; col: string; val: unknown }[] } = {
  tables: {},
  rpc: {},
  eqs: [],
};

function query(table: string) {
  const q: Record<string, unknown> = {};
  for (const m of ["select", "order", "in", "limit", "is", "neq", "gte", "lt"]) q[m] = () => q;
  q.eq = (col: string, val: unknown) => {
    fx.eqs.push({ table, col, val });
    return q;
  };
  q.single = () => q;
  q.maybeSingle = () => q;
  q.then = (resolve: (v: unknown) => unknown) => resolve(fx.tables[table] ?? { data: [], error: null });
  return q;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "auth-1", email: "a@b.test" } } }) },
    rpc: async (name: string) => fx.rpc[name] ?? { data: null, error: null },
    from: (table: string) => query(table),
  }),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "dummy");
  fx.tables = {};
  fx.rpc = {};
  fx.eqs = [];
});
afterEach(() => vi.unstubAllEnvs());

describe("account ↔ member (S19)", () => {
  it("classifies each login: linked, old same-id, or 'perlu dicek'", async () => {
    const { getAccountApprovals } = await import("@/lib/data");
    fx.tables.account_approvals = {
      data: [
        { user_id: "u-linked", email: "x@y", display_name: null, status: "approved", requested_at: "2026-10-01", note: null, profile_id: "p-7" },
        { user_id: "u-old", email: "o@y", display_name: null, status: "approved", requested_at: "2026-09-01", note: null, profile_id: null },
        { user_id: "u-new", email: "n@y", display_name: null, status: "approved", requested_at: "2026-10-10", note: null, profile_id: null },
      ],
      error: null,
    };
    fx.tables.profiles = { data: [{ id: "p-7", nickname: "Angel" }, { id: "u-old", nickname: "Dex" }], error: null };
    const out = await getAccountApprovals();
    expect(out.map((a) => [a.userId, a.link, a.memberId, a.memberName])).toEqual([
      ["u-linked", "linked", "p-7", "Angel"],
      ["u-old", "same_id", "u-old", "Dex"],
      ["u-new", "unlinked", null, null],
    ]);
  }, 30_000);

  it("Kelompokku reads the linked member, not the raw auth id", async () => {
    const { getMyLeaderCrossIds } = await import("@/lib/data");
    fx.rpc.my_profile_id = { data: "p-7", error: null };
    fx.tables.cross_memberships = { data: [{ cross_id: "c-1" }], error: null };
    expect(await getMyLeaderCrossIds()).toEqual(["c-1"]);
    expect(fx.eqs).toContainEqual({ table: "cross_memberships", col: "profile_id", val: "p-7" });
  });

  it("audit rows carry who did them", async () => {
    const { getRecentActivity } = await import("@/lib/data");
    fx.tables.audit_logs = {
      data: [
        { id: "1", action: "Menambah ibadah", timestamp: "2026-10-16T10:00:00Z", user_id: "p-7" },
        { id: "2", action: "Impor", timestamp: "2026-10-16T09:00:00Z", user_id: null },
      ],
      error: null,
    };
    fx.tables.profiles = { data: [{ id: "p-7", nickname: "Angel" }], error: null };
    const out = await getRecentActivity(10);
    expect(out.map((a) => a.actorName)).toEqual(["Angel", null]);
  });
});
