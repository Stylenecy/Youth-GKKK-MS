import { describe, it, expect, vi, afterEach } from "vitest";

const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));

afterEach(() => {
  vi.unstubAllEnvs();
  rpc.mockReset();
});

describe("/api/keepalive (Supabase free-tier pause guard)", () => {
  it("demo mode answers without touching anything", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { GET } = await import("../src/app/api/keepalive/route");
    const res = await GET(new Request("http://x/api/keepalive"));
    expect(res.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("live mode makes the guest bulletin read, nothing else", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "dummy");
    rpc.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("../src/app/api/keepalive/route");
    const res = await GET(new Request("http://x/api/keepalive"));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("public_bulletin");
  });

  it("with CRON_SECRET set, a request without it is refused", async () => {
    vi.stubEnv("CRON_SECRET", "rahasia-uji");
    const { GET } = await import("../src/app/api/keepalive/route");
    expect((await GET(new Request("http://x/api/keepalive"))).status).toBe(401);
    const ok = await GET(new Request("http://x/api/keepalive", { headers: { authorization: "Bearer rahasia-uji" } }));
    expect(ok.status).not.toBe(401);
  });
});
