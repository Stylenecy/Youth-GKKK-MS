import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

/**
 * Live-mode server gates, exercised against a fake Supabase client.
 *
 * Env values are dummies — only `isSupabaseConfigured()` reads them, and the
 * client itself is mocked, so nothing here can reach a real database.
 */

interface FakeConfig {
  role: string | null;
  roleRpcFails: boolean;
  /** Rows a write returns from `.select("id")` — [] = RLS refused silently. */
  writeRows: { id: string }[];
}

const cfg: FakeConfig = { role: "admin", roleRpcFails: false, writeRows: [] };

/** Chainable stand-in for the PostgREST query builder. */
function query(result: () => { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {};
  for (const m of ["select", "update", "delete", "insert", "eq", "is", "order", "in", "gte", "limit"]) {
    q[m] = () => q;
  }
  q.single = () => q;
  q.then = (resolve: (v: unknown) => unknown) => resolve(result());
  return q;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    rpc: async (name: string) => {
      if (name !== "get_my_app_role") return { data: null, error: null };
      return cfg.roleRpcFails
        ? { data: null, error: { message: "rpc down" } }
        : { data: cfg.role, error: null };
    },
    from: () => query(() => ({ data: cfg.writeRows, error: null })),
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const recordAudit = vi.fn();
vi.mock("@/lib/audit", () => ({ recordAudit: (...a: unknown[]) => recordAudit(...a) }));

// Cold imports of the action/route modules are slow on Windows; warm them
// outside the 5 s per-test budget.
beforeAll(async () => {
  await Promise.all([
    import("@/app/actions/gatherings"),
    import("@/app/dashboard/finance/export/route"),
  ]);
}, 60_000);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "dummy-anon-key");
  cfg.role = "admin";
  cfg.roleRpcFails = false;
  cfg.writeRows = [];
  recordAudit.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireRole", () => {
  it("treats a failed role RPC as member and refuses committee work", async () => {
    const { requireRole } = await import("@/lib/role-guard");
    const { COMMITTEE_ROLES } = await import("@/lib/roles");
    cfg.roleRpcFails = true;
    const res = await requireRole(COMMITTEE_ROLES, "ditolak");
    expect(res).toEqual({ ok: false, error: "ditolak" });
  });

  it("lets a committee role through", async () => {
    const { requireRole } = await import("@/lib/role-guard");
    const { COMMITTEE_ROLES } = await import("@/lib/roles");
    cfg.role = "ministry";
    const res = await requireRole(COMMITTEE_ROLES, "ditolak");
    expect(res.ok).toBe(true);
  });
});

describe("writes that RLS refuses silently", () => {
  it("archiveEvent: 0 rows changed → NOTHING_CHANGED, no audit row", async () => {
    const { archiveEvent } = await import("@/app/actions/gatherings");
    const { NOTHING_CHANGED } = await import("@/lib/role-guard");
    cfg.writeRows = [];
    const res = await archiveEvent("event-1");
    expect(res).toEqual({ success: false, error: NOTHING_CHANGED });
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("archiveEvent: a real change is audited", async () => {
    const { archiveEvent } = await import("@/app/actions/gatherings");
    cfg.writeRows = [{ id: "event-1" }];
    const res = await archiveEvent("event-1");
    expect(res).toEqual({ success: true });
    expect(recordAudit).toHaveBeenCalledTimes(1);
  });

  it("removeStewardAssignment: 0 rows deleted → honest failure, no audit row", async () => {
    const { removeStewardAssignment } = await import("@/app/actions/gatherings");
    const { NOTHING_CHANGED } = await import("@/lib/role-guard");
    cfg.writeRows = [];
    const res = await removeStewardAssignment("assignment-1", "event-1");
    expect(res).toEqual({ success: false, error: NOTHING_CHANGED });
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("archiveEvent by a non-committee role never reaches the database", async () => {
    const { archiveEvent } = await import("@/app/actions/gatherings");
    const { NOT_COMMITTEE } = await import("@/lib/role-guard");
    cfg.role = "leader";
    cfg.writeRows = [{ id: "event-1" }];
    const res = await archiveEvent("event-1");
    expect(res).toEqual({ success: false, error: NOT_COMMITTEE });
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

describe("cash-book CSV export", () => {
  it("answers 403 text/plain to a Cross leader", async () => {
    const { GET } = await import("@/app/dashboard/finance/export/route");
    cfg.role = "leader";
    const res = await GET();
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toContain("text/plain");
  });
});
