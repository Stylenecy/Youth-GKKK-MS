import { isSupabaseConfigured } from "./supabase/env";
import type {
  Profile, Event, StewardAssignment, Cross, FinanceTransaction,
  Meeting, DashboardStats, FatigueAlert, RecentActivity, MemberStatus,
} from "./types";

// ============================================================
// DUAL-MODE DATA LAYER
// If Supabase env keys exist → query DB
// Else → fallback to seed.ts (demo mode)
// ============================================================

/**
 * Explicit profile columns — deliberately NOT `select("*")`.
 *
 * Migration 0006 revokes column-level SELECT on `profiles.whatsapp` from
 * anon + authenticated, so `select("*")` would error out and, if it ever
 * did succeed, would ship phone numbers to every signed-in client. The
 * number only leaves the database through getMemberWhatsapp(), which runs
 * the SECURITY DEFINER function get_member_whatsapp() and re-checks the
 * caller's role in SQL.
 */
const PROFILE_COLUMNS =
  "id,full_name,nickname,birth_date,hometown,university,cohort,status,avatar_url,is_active,created_at,updated_at";

/**
 * A profile row as the database ever sends it: snake_case, and — thanks to
 * the column-level revoke — NO whatsapp field. Profile.whatsapp is typed
 * non-optional precisely because the row below must be mapped explicitly;
 * the type error you'd get from `as Profile` is the compiler proving the
 * number cannot arrive this way. Real numbers come only from
 * getMemberWhatsapp().
 */
interface ProfileRow {
  id: string;
  full_name: string;
  nickname: string;
  birth_date: string | null;
  hometown: string | null;
  university: string | null;
  cohort: string | null;
  status: MemberStatus;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname,
    whatsapp: null,
    birthDate: row.birth_date,
    hometown: row.hometown,
    university: row.university,
    cohort: row.cohort,
    status: row.status,
    avatarUrl: row.avatar_url,
    serviceCount30d: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * The one sanctioned path for a member's WhatsApp number.
 *
 * Supabase mode: calls the SECURITY DEFINER RPC, which returns the number
 * only when the signed-in role is admin/treasurer/leader/ministry — the
 * column itself is revoked from clients entirely.
 * Demo mode: falls back to the seed's fake numbers (prefix 6280000), so
 * the button is verifiable without a database. Real numbers never live in
 * the seed.
 */
export async function getMemberWhatsapp(
  profileId: string
): Promise<string | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_member_whatsapp", {
      p_profile_id: profileId,
    });
    return typeof data === "string" && data.length > 0 ? data : null;
  }

  const { seedProfiles } = await import("./seed");
  return seedProfiles.find((p) => p.id === profileId)?.whatsapp ?? null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const [members, events, crossGroups, finance] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact" }).gte("date", new Date().toISOString().slice(0, 8) + "01"),
      supabase.from("crosses").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("finance_transactions").select("amount,type").is("deleted_at", null).gte("created_at", new Date().toISOString().slice(0, 8) + "01"),
    ]);

    const income = (finance.data ?? []).filter((f: any) => f.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
    const expense = (finance.data ?? []).filter((f: any) => f.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);

    return {
      totalMembers: members.count ?? 0,
      activeCrossGroups: crossGroups.count ?? 0,
      monthGatherings: events.data?.length ?? 0,
      monthlyBalance: income - expense,
    };
  }

  const { getDashboardStats } = await import("./seed");
  return getDashboardStats();
}

export async function getUpcomingGathering() {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .gte("date", now)
      .neq("status", "archived")
      .order("date", { ascending: true })
      .limit(1)
      .single();

    if (!event) return null;

    const { data: stewards } = await supabase
      .from("steward_assignments")
      .select("*")
      .eq("event_id", event.id);

    const profileIds = [...new Set((stewards ?? []).map(s => s.profile_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,nickname")
      .in("id", profileIds);

    const stewardAssignments = (stewards ?? []).map(s => ({
      ...s,
      memberId: s.profile_id,
      member: (profiles ?? []).find((p: any) => p.id === s.profile_id),
    }));

    return { ...event, stewardAssignments };
  }

  const { getUpcomingGathering } = await import("./seed");
  return getUpcomingGathering();
}

export async function getFatigueAlerts(): Promise<FatigueAlert[]> {
  if (isSupabaseConfigured()) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();

    const { data: assignments } = await supabase
      .from("steward_assignments")
      .select("profile_id")
      .gte("created_at", thirtyDaysAgo);

    const countMap: Record<string, number> = {};
    (assignments ?? []).forEach((a: any) => {
      countMap[a.profile_id] = (countMap[a.profile_id] || 0) + 1;
    });

    const alertIds = Object.entries(countMap)
      .filter(([_, count]) => count > 3)
      .map(([id]) => id);

    if (alertIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .in("id", alertIds);

    return (profiles ?? []).map((p: any) => ({
      member: { ...p, serviceCount30d: countMap[p.id] },
      serviceCount: countMap[p.id],
    }));
  }

  const { getFatigueAlerts } = await import("./seed");
  return getFatigueAlerts();
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("audit_logs")
      .select("id,action,timestamp")
      .order("timestamp", { ascending: false })
      .limit(5);

    return (data ?? []).map((log: any) => ({
      id: log.id,
      description: log.action,
      createdAt: log.timestamp,
    }));
  }

  const { getRecentActivity } = await import("./seed");
  return getRecentActivity();
}

export async function getProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).order("full_name");
    return (data ?? []).map(mapProfileRow);
  }

  const { seedProfiles } = await import("./seed");
  return seedProfiles;
}

export async function getProfileById(id: string): Promise<Profile | undefined> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).single();
    return data ? mapProfileRow(data) : undefined;
  }

  const profiles = await getProfiles();
  return profiles.find(p => p.id === id);
}

export async function getEvents(): Promise<Event[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
    return (data ?? []) as Event[];
  }

  const { seedEvents } = await import("./seed");
  return seedEvents;
}

export async function getEventById(id: string): Promise<Event | undefined> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("events").select("*").eq("id", id).single();
    return data as Event | undefined;
  }

  const events = await getEvents();
  return events.find(e => e.id === id);
}

export async function getStewardsByEvent(eventId: string): Promise<StewardAssignment[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data: stewards } = await supabase
      .from("steward_assignments")
      .select("*")
      .eq("event_id", eventId);

    const profileIds = [...new Set((stewards ?? []).map(s => s.profile_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .in("id", profileIds);

    return (stewards ?? []).map(s => ({
      ...s,
      memberId: s.profile_id,
      member: (profiles ?? []).find((p: any) => p.id === s.profile_id),
    })) as StewardAssignment[];
  }

  const { seedStewards, seedProfiles } = await import("./seed");
  return seedStewards
    .filter(s => s.eventId === eventId)
    .map(s => ({ ...s, member: seedProfiles.find(p => p.id === s.profileId) }));
}

export async function getCrosses(): Promise<Cross[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("crosses").select("*").eq("is_active", true);
    return (data ?? []) as Cross[];
  }

  const { seedCrosses } = await import("./seed");
  return seedCrosses;
}

/**
 * Active members of one Cross group, leader included.
 *
 * Returns profiles rather than raw membership rows: every caller so far
 * wants to render people, and doing the join here keeps the demo path and
 * the Supabase path returning the same shape.
 */
export async function getCrossMembers(crossId: string): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();

    const { data: memberships } = await supabase
      .from("cross_memberships")
      .select("profile_id")
      .eq("cross_id", crossId)
      .eq("is_active", true);

    const ids = [...new Set((memberships ?? []).map((m: any) => m.profile_id))];
    if (ids.length === 0) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .in("id", ids)
      .order("full_name");

    return (profiles ?? []).map(mapProfileRow);
  }

  const { seedCrossMemberships, seedProfiles } = await import("./seed");
  return seedCrossMemberships
    .filter(m => m.crossId === crossId && m.isActive)
    .map(m => seedProfiles.find(p => p.id === m.profileId))
    .filter((p): p is Profile => p !== undefined)
    .sort((a, b) => a.nickname.localeCompare(b.nickname, "id"));
}

/** Everyone with an active `leader` membership on one Cross — may be more than one. */
export async function getCrossLeaders(crossId: string): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();

    const { data: memberships } = await supabase
      .from("cross_memberships")
      .select("profile_id")
      .eq("cross_id", crossId)
      .eq("role", "leader")
      .eq("is_active", true);

    const ids = [...new Set((memberships ?? []).map((m: any) => m.profile_id))];
    if (ids.length === 0) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .in("id", ids);
    return (profiles ?? []).map(mapProfileRow);
  }

  const { seedCrossMemberships, seedProfiles } = await import("./seed");
  return seedCrossMemberships
    .filter(m => m.crossId === crossId && m.role === "leader" && m.isActive)
    .map(m => seedProfiles.find(p => p.id === m.profileId))
    .filter((p): p is Profile => p !== undefined);
}

/**
 * The signed-in user's own profile, with `appRole` attached.
 *
 * `appRole` comes from the get_my_app_role() RPC (migration 0004), which
 * checks a locked-down admin_emails table in Postgres — not an env var.
 * That keeps exactly one source of truth for "who is admin": the same
 * table the write-side RPCs (add_cross_member, etc.) already check, so
 * this can never drift out of sync with what a leader is actually allowed
 * to do. Returns null outside a real session (demo mode, or Supabase
 * configured but nobody logged in).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: appRole }] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).single(),
    supabase.rpc("get_my_app_role"),
  ]);
  if (!profile) return null;

  return { ...mapProfileRow(profile), appRole: (appRole as Profile["appRole"]) ?? "member" };
}

/** Cross ids the signed-in user actively leads. Empty outside a real session. */
export async function getMyLeaderCrossIds(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("cross_memberships")
    .select("cross_id")
    .eq("profile_id", user.id)
    .eq("role", "leader")
    .eq("is_active", true);

  return [...new Set((data ?? []).map((r: any) => r.cross_id as string))];
}

/** Leader nicknames for every Cross, keyed by cross id — one query for a list page. */
export async function getAllCrossLeaderNicknames(): Promise<Record<string, string[]>> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data: memberships } = await supabase
      .from("cross_memberships")
      .select("cross_id,profile_id")
      .eq("role", "leader")
      .eq("is_active", true);

    const ids = [...new Set((memberships ?? []).map((m: any) => m.profile_id))];
    if (ids.length === 0) return {};
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,nickname")
      .in("id", ids);
    const nicknameById = new Map((profiles ?? []).map((p: any) => [p.id, p.nickname]));

    return (memberships ?? []).reduce((acc: Record<string, string[]>, m: any) => {
      const nickname = nicknameById.get(m.profile_id);
      if (!nickname) return acc;
      (acc[m.cross_id] ??= []).push(nickname);
      return acc;
    }, {});
  }

  const { seedCrossMemberships, seedProfiles } = await import("./seed");
  return seedCrossMemberships
    .filter(m => m.role === "leader" && m.isActive)
    .reduce((acc: Record<string, string[]>, m) => {
      const nickname = seedProfiles.find(p => p.id === m.profileId)?.nickname;
      if (!nickname) return acc;
      (acc[m.crossId] ??= []).push(nickname);
      return acc;
    }, {});
}

/** Active member counts for every Cross, keyed by cross id. */
export async function getCrossMemberCounts(): Promise<Record<string, number>> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("cross_memberships")
      .select("cross_id")
      .eq("is_active", true);

    return (data ?? []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.cross_id] = (acc[row.cross_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const { seedCrossMemberships } = await import("./seed");
  return seedCrossMemberships
    .filter(m => m.isActive)
    .reduce((acc: Record<string, number>, m) => {
      acc[m.crossId] = (acc[m.crossId] ?? 0) + 1;
      return acc;
    }, {});
}

export async function getFinanceTransactions(): Promise<FinanceTransaction[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    // Soft-deleted rows stay in the table but must never reach a balance.
    const { data } = await supabase
      .from("finance_transactions")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []) as FinanceTransaction[];
  }

  const { seedFinance } = await import("./seed");
  return seedFinance;
}

export async function getMeetings(): Promise<Meeting[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("meeting_notes").select("*").order("date", { ascending: false });
    return (data ?? []) as Meeting[];
  }

  const { seedMeetings } = await import("./seed");
  return seedMeetings;
}

export async function getMeetingById(id: string): Promise<Meeting | undefined> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("meeting_notes").select("*").eq("id", id).single();
    return data as Meeting | undefined;
  }

  const meetings = await getMeetings();
  return meetings.find(m => m.id === id);
}

export { isSupabaseConfigured };
