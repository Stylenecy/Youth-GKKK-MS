import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

/**
 * Every write action, live mode and demo mode (audit R6 #11, 16 Okt 2026).
 *
 * The Supabase client is a fake: each table / RPC answers from `fx`, and
 * every insert and RPC call is recorded so a test can prove a write did — or
 * did not — reach the database. Env values are dummies; nothing here can
 * touch a real project.
 */

type Res = { data: unknown; error: { message: string; code?: string } | null };

const fx: {
  role: string;
  tables: Record<string, Res>;
  rpc: Record<string, Res>;
  inserts: { table: string; payload: unknown }[];
  rpcCalls: { name: string; args: unknown }[];
} = { role: "admin", tables: {}, rpc: {}, inserts: [], rpcCalls: [] };

function query(table: string) {
  const answer = () => fx.tables[table] ?? { data: [], error: null };
  const q: Record<string, unknown> = {};
  for (const m of ["select", "update", "delete", "eq", "is", "order", "in", "gte", "lt", "neq", "limit"]) {
    q[m] = () => q;
  }
  q.insert = (payload: unknown) => {
    fx.inserts.push({ table, payload });
    return q;
  };
  q.single = () => q;
  q.maybeSingle = () => q;
  q.then = (resolve: (v: unknown) => unknown) => resolve(answer());
  return q;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    rpc: async (name: string, args: unknown) => {
      fx.rpcCalls.push({ name, args });
      if (name === "get_my_app_role") return { data: fx.role, error: null };
      return fx.rpc[name] ?? { data: null, error: null };
    },
    from: (table: string) => query(table),
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const recordAudit = vi.fn();
vi.mock("@/lib/audit", () => ({ recordAudit: (...a: unknown[]) => recordAudit(...a) }));

beforeAll(async () => {
  await Promise.all([
    import("@/app/actions/gatherings"),
    import("@/app/actions/finance"),
    import("@/app/actions/attendance"),
    import("@/app/actions/cross"),
    import("@/app/actions/accounts"),
    import("@/app/actions/members"),
  ]);
}, 60_000);

const live = () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "dummy-anon-key");
};
const demo = () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
};

beforeEach(() => {
  live();
  fx.role = "admin";
  fx.tables = {};
  fx.rpc = {};
  fx.inserts = [];
  fx.rpcCalls = [];
  recordAudit.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const goodEvent = () =>
  form({
    date: "2026-12-05",
    time: "17:00",
    weeklyTheme: "Satu tubuh",
    eventType: "worship",
    picId: "pic-1",
    speakerName: "Pembicara",
    description: "",
  });

describe("createEvent / updateEvent", () => {
  it("rejects an invalid form before touching the database", async () => {
    const { createEvent } = await import("@/app/actions/gatherings");
    const res = await createEvent(form({ date: "", weeklyTheme: "x", eventType: "worship", picId: "", speakerName: "" }));
    expect(res.success).toBe(false);
    expect(fx.inserts).toHaveLength(0);
  });

  it("refuses a non-committee role", async () => {
    const { createEvent } = await import("@/app/actions/gatherings");
    const { NOT_COMMITTEE } = await import("@/lib/role-guard");
    fx.role = "leader";
    const res = await createEvent(goodEvent());
    expect(res).toEqual({ success: false, errors: { form: [NOT_COMMITTEE] } });
    expect(fx.inserts).toHaveLength(0);
  });

  it("puts a non-pengurus PIC error on the PIC field", async () => {
    const { createEvent } = await import("@/app/actions/gatherings");
    fx.rpc.is_pic_eligible = { data: false, error: null };
    const res = await createEvent(goodEvent());
    expect(res.success).toBe(false);
    expect((res as { errors: Record<string, string[]> }).errors.picId[0]).toMatch(/PIC harus Pengurus/);
    expect(fx.inserts).toHaveLength(0);
  });

  it("inserts a draft event and audits it", async () => {
    const { createEvent } = await import("@/app/actions/gatherings");
    fx.rpc.is_pic_eligible = { data: true, error: null };
    fx.tables.events = { data: { id: "event-9" }, error: null };
    const res = await createEvent(goodEvent());
    expect(res).toEqual({ success: true });
    expect(fx.inserts[0].table).toBe("events");
    expect(fx.inserts[0].payload).toMatchObject({ status: "draft", pic_id: "pic-1" });
    expect(recordAudit).toHaveBeenCalledWith("Menambah ibadah", "event", "event-9", expect.anything());
  });

  it("updateEvent keeps an old PIC without re-checking it (PIC unchanged)", async () => {
    const { updateEvent } = await import("@/app/actions/gatherings");
    // The event already has pic-1, who is no longer eligible (e.g. a Cross
    // leader before 0025). Changing only the theme must still be allowed.
    fx.rpc.is_pic_eligible = { data: false, error: null };
    fx.tables.events = { data: { pic_id: "pic-1" }, error: null };
    await updateEvent("event-1", goodEvent());
    expect(fx.rpcCalls.some((c) => c.name === "is_pic_eligible")).toBe(false);
  });

  it("updateEvent re-checks a changed PIC and puts the error on the field", async () => {
    const { updateEvent } = await import("@/app/actions/gatherings");
    fx.rpc.is_pic_eligible = { data: false, error: null };
    fx.tables.events = { data: { pic_id: "pic-old" }, error: null };
    const res = await updateEvent("event-1", goodEvent());
    expect(fx.rpcCalls.some((c) => c.name === "is_pic_eligible")).toBe(true);
    expect((res as { errors: Record<string, string[]> }).errors.picId[0]).toMatch(/PIC harus Pengurus/);
  });

  it("updateEvent that changes 0 rows says nothing changed", async () => {
    const { updateEvent } = await import("@/app/actions/gatherings");
    const { NOTHING_CHANGED } = await import("@/lib/role-guard");
    fx.rpc.is_pic_eligible = { data: true, error: null };
    fx.tables.events = { data: [], error: null };
    const res = await updateEvent("event-1", goodEvent());
    expect(res).toEqual({ success: false, errors: { form: [NOTHING_CHANGED] } });
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

describe("assignSteward", () => {
  it("rejects an unknown role", async () => {
    const { assignSteward } = await import("@/app/actions/gatherings");
    const res = await assignSteward("event-1", "p-1", "Penari");
    expect(res.success).toBe(false);
    expect(fx.inserts).toHaveLength(0);
  });

  it("refuses an archived gathering", async () => {
    const { assignSteward } = await import("@/app/actions/gatherings");
    fx.tables.events = { data: { date: days(3), status: "archived" }, error: null };
    const res = await assignSteward("event-1", "p-1", "WL");
    expect(res).toMatchObject({ success: false, error: expect.stringMatching(/diarsipkan/) });
    expect(fx.inserts).toHaveLength(0);
  });

  it("refuses a gathering that already took place", async () => {
    const { assignSteward } = await import("@/app/actions/gatherings");
    fx.tables.events = { data: { date: days(-2), status: "published" }, error: null };
    const res = await assignSteward("event-1", "p-1", "WL");
    expect(res).toMatchObject({ success: false, error: expect.stringMatching(/sudah lewat/) });
    expect(fx.inserts).toHaveLength(0);
  });

  it("says so when the gathering does not exist", async () => {
    const { assignSteward } = await import("@/app/actions/gatherings");
    fx.tables.events = { data: null, error: null };
    const res = await assignSteward("event-1", "p-1", "WL");
    expect(res).toMatchObject({ success: false, error: expect.stringMatching(/tidak ditemukan/) });
  });

  it("staffs an upcoming gathering and audits it", async () => {
    const { assignSteward } = await import("@/app/actions/gatherings");
    fx.tables.events = { data: { date: days(3), status: "published" }, error: null };
    fx.tables.steward_assignments = { data: { id: "sa-1" }, error: null };
    const res = await assignSteward("event-1", "p-1", "WL");
    expect(res).toEqual({ success: true, id: "sa-1" });
    expect(fx.inserts[0]).toMatchObject({ table: "steward_assignments", payload: { role: "WL", status: "assigned" } });
    expect(recordAudit).toHaveBeenCalledTimes(1);
  });

  it("demo mode applies the same rule to the seed", async () => {
    demo();
    const { assignSteward } = await import("@/app/actions/gatherings");
    // Arion ("4") is free on e1; Dex ("1") already plays Pemusik there.
    expect(await assignSteward("e1", "4", "Usher")).toEqual({ success: true, id: null });
    expect(await assignSteward("e1", "1", "WL")).toEqual({
      success: false,
      error: "Orang ini sudah bertugas di ibadah yang sama. Satu orang satu peran — pilih orang lain.",
    });
    expect(await assignSteward("nope", "1", "WL")).toMatchObject({ success: false });
    expect(fx.inserts).toHaveLength(0);
  });
});

describe("markAttendance", () => {
  it("rejects malformed input", async () => {
    const { markAttendance } = await import("@/app/actions/attendance");
    const res = await markAttendance("", "p-1", true);
    expect(res.success).toBe(false);
    expect(fx.rpcCalls).toHaveLength(0);
  });

  it("translates the database refusal and writes no audit row", async () => {
    const { markAttendance } = await import("@/app/actions/attendance");
    fx.rpc.mark_attendance = { data: null, error: { message: "not_allowed_to_record" } };
    const res = await markAttendance("event-1", "p-1", true);
    expect(res).toMatchObject({ success: false, error: expect.stringMatching(/tidak punya hak mencatat/) });
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("records through the RPC and audits", async () => {
    const { markAttendance } = await import("@/app/actions/attendance");
    const res = await markAttendance("event-1", "p-1", true);
    expect(res).toEqual({ success: true });
    expect(fx.rpcCalls.some((c) => c.name === "mark_attendance")).toBe(true);
    expect(recordAudit).toHaveBeenCalledTimes(1);
  });
});

describe("cash book", () => {
  const goodTx = () =>
    form({ amount: "50000", type: "income", account: "kas_besar", category: "donasi", description: "Donasi Sabtu", eventId: "" });

  it("refuses a non-treasurer", async () => {
    const { createTransaction } = await import("@/app/actions/finance");
    fx.role = "leader";
    const res = await createTransaction(goodTx());
    expect(res.success).toBe(false);
    expect((res as { errors: { form: string[] } }).errors.form[0]).toMatch(/bukan bendahara/);
    expect(fx.inserts).toHaveLength(0);
  });

  it("records who wrote the transaction", async () => {
    const { createTransaction } = await import("@/app/actions/finance");
    fx.role = "treasurer";
    fx.tables.finance_transactions = { data: { id: "tx-1" }, error: null };
    const res = await createTransaction(goodTx());
    expect(res).toEqual({ success: true });
    expect(fx.inserts[0].payload).toMatchObject({ amount: 50000, recorded_by: "user-1", event_id: null });
  });

  it("deleteTransaction that changes 0 rows is an honest failure", async () => {
    const { deleteTransaction } = await import("@/app/actions/finance");
    const { NOTHING_CHANGED } = await import("@/lib/role-guard");
    fx.tables.finance_transactions = { data: [], error: null };
    expect(await deleteTransaction("tx-1")).toEqual({ success: false, error: NOTHING_CHANGED });
  });

  const lines = [
    "2026-10-03\tKas Besar\tPemasukan\tDonasi\t50000\tDonasi Sabtu",
    "2026-10-04\tKas Kecil\tPengeluaran\tKonsumsi\t20000\tSnack latihan",
  ].join("\n");

  it("import is all-or-nothing: one bad line inserts nothing", async () => {
    const { importTransactions } = await import("@/app/actions/finance");
    const res = await importTransactions(lines + "\n2026-10-05\tKas Besar\tPemasukan\tTidak Ada\t1000\tx");
    expect(res.success).toBe(false);
    expect(res.errors).toHaveLength(1);
    expect(fx.inserts).toHaveLength(0);
  });

  it("import inserts every line with recorded_by", async () => {
    const { importTransactions } = await import("@/app/actions/finance");
    const res = await importTransactions(lines);
    expect(res).toMatchObject({ success: true, count: 2 });
    const rows = fx.inserts[0].payload as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.recorded_by === "user-1")).toBe(true);
  });

  it("demo mode validates the same lines and saves nothing", async () => {
    demo();
    const { importTransactions } = await import("@/app/actions/finance");
    expect(await importTransactions(lines)).toMatchObject({ success: true, count: 2 });
    expect(fx.inserts).toHaveLength(0);
  });
});

describe("Cross and account approval", () => {
  it("claim needs a code, then a login in demo mode", async () => {
    const { claimCrossLeadership } = await import("@/app/actions/cross");
    const { DEMO_NEEDS_LOGIN } = await import("@/lib/demo");
    expect(await claimCrossLeadership("c-1", " ")).toMatchObject({ success: false, error: expect.stringMatching(/wajib/) });
    demo();
    expect(await claimCrossLeadership("c-1", "KODE")).toEqual({ success: false, error: DEMO_NEEDS_LOGIN });
  });

  it("a wrong code is translated, not shown raw", async () => {
    const { claimCrossLeadership } = await import("@/app/actions/cross");
    fx.rpc.claim_cross_leadership = { data: null, error: { message: "invalid_code" } };
    expect(await claimCrossLeadership("c-1", "SALAH")).toMatchObject({ error: expect.stringMatching(/Kode akses salah/) });
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("a pending account is told it needs approval (migration 0021)", async () => {
    const { claimCrossLeadership, addCrossMember } = await import("@/app/actions/cross");
    fx.rpc.claim_cross_leadership = { data: null, error: { message: "not_approved" } };
    fx.rpc.add_cross_member = { data: null, error: { message: "not_approved" } };
    expect(await claimCrossLeadership("c-1", "KODE")).toMatchObject({ error: expect.stringMatching(/belum disetujui/) });
    expect(await addCrossMember("c-1", "Budi")).toMatchObject({ error: expect.stringMatching(/belum disetujui/) });
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("addCrossMember validates the name and audits a success", async () => {
    const { addCrossMember } = await import("@/app/actions/cross");
    expect(await addCrossMember("c-1", "   ")).toMatchObject({ success: false });
    expect(await addCrossMember("c-1", "Budi")).toEqual({ success: true });
    expect(recordAudit).toHaveBeenCalledWith("Menambah anggota Cross", "cross", "c-1", { after: { name: "Budi" } });
  });

  it("linkAccountToProfile: input, demo, refusal, success (S19, migration 0023)", async () => {
    const { linkAccountToProfile } = await import("@/app/actions/accounts");
    const { DEMO_NEEDS_LOGIN } = await import("@/lib/demo");
    expect(await linkAccountToProfile("u-2", "")).toMatchObject({ success: false, error: expect.stringMatching(/Pilih anggota/) });
    fx.rpc.link_account_to_profile = { data: null, error: { message: "profile_taken" } };
    expect(await linkAccountToProfile("u-2", "p-9")).toMatchObject({ error: expect.stringMatching(/sudah tertaut ke akun lain/) });
    expect(recordAudit).not.toHaveBeenCalled();
    fx.rpc.link_account_to_profile = { data: null, error: null };
    expect(await linkAccountToProfile("u-2", "p-9")).toEqual({ success: true });
    expect(fx.rpcCalls.find((c) => c.name === "link_account_to_profile")?.args).toEqual({ p_user_id: "u-2", p_profile_id: "p-9" });
    expect(recordAudit).toHaveBeenCalledWith("Menautkan akun ke data anggota", "account", "u-2", { after: { profileId: "p-9" } });
    demo();
    expect(await linkAccountToProfile("u-2", "p-9")).toEqual({ success: false, error: DEMO_NEEDS_LOGIN });
  });

  it("unlinkAccount: refusal translated, success audited, demo needs login (migration 0024)", async () => {
    const { unlinkAccount } = await import("@/app/actions/accounts");
    const { DEMO_NEEDS_LOGIN } = await import("@/lib/demo");
    fx.rpc.unlink_account = { data: null, error: { message: "not_an_admin" } };
    expect(await unlinkAccount("u-2")).toMatchObject({ error: expect.stringMatching(/Hanya admin/) });
    fx.rpc.unlink_account = { data: null, error: null };
    expect(await unlinkAccount("u-2")).toEqual({ success: true });
    expect(recordAudit).toHaveBeenCalledWith("Melepas tautan akun dari data anggota", "account", "u-2");
    demo();
    expect(await unlinkAccount("u-2")).toEqual({ success: false, error: DEMO_NEEDS_LOGIN });
  });

  it("decideAccount: demo needs login, RPC refusal is translated, success audited", async () => {
    const { decideAccount } = await import("@/app/actions/accounts");
    const { DEMO_NEEDS_LOGIN } = await import("@/lib/demo");
    fx.rpc.decide_account = { data: null, error: { message: "not_an_admin" } };
    expect(await decideAccount("u-2", "approved")).toMatchObject({ error: expect.stringMatching(/Hanya admin/) });
    fx.rpc.decide_account = { data: null, error: null };
    expect(await decideAccount("u-2", "approved")).toEqual({ success: true });
    expect(recordAudit).toHaveBeenCalledTimes(1);
    demo();
    expect(await decideAccount("u-2", "approved")).toEqual({ success: false, error: DEMO_NEEDS_LOGIN });
  });
});

describe("setPengurus", () => {
  it("rejects bad input before calling the database", async () => {
    const { setPengurus } = await import("@/app/actions/members");
    expect(await setPengurus("", true)).toMatchObject({ success: false });
    expect(fx.rpcCalls).toHaveLength(0);
  });

  it("needs a real login in demo mode", async () => {
    demo();
    const { setPengurus } = await import("@/app/actions/members");
    const { DEMO_NEEDS_LOGIN } = await import("@/lib/demo");
    expect(await setPengurus("p-1", true)).toEqual({ success: false, error: DEMO_NEEDS_LOGIN });
  });

  it("calls set_pengurus and lets SQL write the audit line (no second row)", async () => {
    const { setPengurus } = await import("@/app/actions/members");
    expect(await setPengurus("p-1", true)).toEqual({ success: true });
    expect(fx.rpcCalls).toContainEqual({ name: "set_pengurus", args: { p_profile_id: "p-1", p_value: true } });
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("translates the admin-only refusal", async () => {
    const { setPengurus } = await import("@/app/actions/members");
    fx.rpc.set_pengurus = { data: null, error: { message: "only_admin_sets_pengurus" } };
    expect(await setPengurus("p-1", false)).toEqual({
      success: false,
      error: "Hanya admin yang bisa menandai atau mencabut Pengurus.",
    });
  });
});

