import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./supabase/env";
import { mapAttendanceRow } from "./attendance";
import { FATIGUE_THRESHOLD } from "./fatigue";
import type {
  Profile, Event, StewardAssignment, AttendanceRecord, Cross, FinanceTransaction,
  Meeting, DashboardStats, FatigueAlert, RecentActivity, MemberStatus,
  EventType, EventStatus, StewardStatus, FinanceType, FinanceAccount, AppRole,
} from "./types";

// ============================================================
// DUAL-MODE DATA LAYER
// If Supabase env keys exist → query DB
// Else → fallback to seed.ts (demo mode)
// ============================================================

interface ReadResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Supabase reports a failed read in `error`; it does not throw. Reading only
 * `data` turned "the database refused" (expired session, RLS, network) into
 * "there is nothing here" — an empty roster or cash book that looks real.
 * Every list read goes through this so a failure reaches the route's error
 * boundary (`error.tsx`) instead.
 */
function rows<T>(res: ReadResult<T[]>, what: string): T[] {
  if (res.error) throw new Error(`Gagal memuat ${what}: ${res.error.message}`);
  return res.data ?? [];
}

/** Same for `.single()`: "no row" (PostgREST PGRST116) is an answer, not a failure. */
function one<T>(res: ReadResult<T>, what: string): T | null {
  if (res.error) {
    if (res.error.code === "PGRST116") return null;
    throw new Error(`Gagal memuat ${what}: ${res.error.message}`);
  }
  return res.data;
}

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
  "id,full_name,nickname,birth_date,hometown,university,cohort,status,notes,avatar_url,is_active,created_at,updated_at";

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
  notes: string | null;
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
    notes: row.notes,
    avatarUrl: row.avatar_url,
    serviceCount30d: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/*
 * Row types + mappers for every table this file reads.
 *
 * These exist because `select("*")` returns snake_case and the app types are
 * camelCase. Casting the raw row (`data as Event[]`) type-checks but silently
 * produces objects whose camelCase fields are all `undefined` — the compiler
 * cannot catch it because a cast is a promise, not a check. That is exactly
 * how `picId` came back empty for events that had `pic_id` set in the
 * database, and how finance rows lost `createdAt` and rendered Invalid Date.
 *
 * Rule for anything added later: map the row, never cast it.
 */

interface EventRow {
  id: string;
  date: string;
  monthly_theme_id: string | null;
  weekly_theme: string;
  event_type: EventType;
  pic_id: string | null;
  speaker_name: string | null;
  description: string | null;
  status: EventStatus;
  archived_at: string | null;
}

function mapEventRow(row: EventRow): Event {
  return {
    id: row.id,
    date: row.date,
    monthlyThemeId: row.monthly_theme_id,
    weeklyTheme: row.weekly_theme,
    eventType: row.event_type,
    picId: row.pic_id,
    speakerName: row.speaker_name,
    description: row.description,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

interface StewardRow {
  id: string;
  event_id: string;
  profile_id: string;
  role: string;
  status: StewardStatus;
  reason: string | null;
  created_at: string;
}

function mapStewardRow(row: StewardRow, member?: Profile): StewardAssignment {
  return {
    id: row.id,
    eventId: row.event_id,
    profileId: row.profile_id,
    role: row.role,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at,
    member,
  };
}

interface CrossRow {
  id: string;
  name: string;
  leader_id: string | null;
  description: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
}

/** `memberCount` is not a column — callers that need it count memberships. */
function mapCrossRow(row: CrossRow, memberCount = 0): Cross {
  return {
    id: row.id,
    name: row.name,
    leaderId: row.leader_id,
    description: row.description ?? "",
    meetingDay: row.meeting_day ?? "",
    meetingTime: row.meeting_time ?? "",
    memberCount,
  };
}

interface FinanceRow {
  id: string;
  event_id: string | null;
  amount: number;
  type: FinanceType;
  account: FinanceAccount;
  category: string;
  description: string;
  receipt_url: string | null;
  recorded_by: string | null;
  created_at: string;
}

function mapFinanceRow(row: FinanceRow): FinanceTransaction {
  return {
    id: row.id,
    eventId: row.event_id,
    amount: row.amount,
    type: row.type,
    // Older rows predate migration 0005; treat an absent account as kas kecil
    // rather than letting `undefined` fall out of every balance filter.
    account: row.account ?? "kas_kecil",
    category: row.category,
    description: row.description,
    receiptUrl: row.receipt_url,
    recordedById: row.recorded_by,
    createdAt: row.created_at,
  };
}

interface MeetingRow {
  id: string;
  title: string;
  date: string;
  /** jsonb — arrives already parsed, so it must not be JSON.parse()d again. */
  content: unknown;
  participants: string[] | null;
  created_at: string;
}

/** Narrow projections — only the columns a query actually selects. */
interface ProfileIdRow { profile_id: string }
interface CrossIdRow { cross_id: string }
interface MembershipPairRow { cross_id: string; profile_id: string }
interface NameRow { id: string; name: string }
interface NicknameRow { id: string; nickname: string }
interface AmountRow { amount: number; type: FinanceType }
interface AuditRow { id: string; action: string; timestamp: string }
interface ApprovalRow {
  user_id: string;
  email: string;
  display_name: string | null;
  status: AccountStatus;
  requested_at: string;
  note: string | null;
}

function mapMeetingRow(row: MeetingRow): Meeting {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    content: typeof row.content === "string" ? row.content : JSON.stringify(row.content ?? {}),
    participants: row.participants ?? [],
    createdAt: row.created_at,
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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [members, events, crossGroups, finance] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
      // Bounded to the calendar month. `gte` alone had no upper bound, so an
      // event scheduled for December counted towards "Bulan Ini" in August.
      supabase.from("events").select("id", { count: "exact" })
        .gte("date", monthStart.toISOString())
        .lt("date", nextMonthStart.toISOString()),
      supabase.from("crosses").select("id", { count: "exact", head: true }).eq("is_active", true),
      // Running balance across ALL transactions, not just the current month.
      // The card is labelled "Saldo Kas"; scoping it to transactions created
      // this month showed Rp 0 whenever nobody had recorded anything yet,
      // which reads as "the treasury is empty" rather than "no entries yet".
      supabase.from("finance_transactions").select("amount,type").is("deleted_at", null),
    ]);

    for (const [what, res] of [
      ["anggota", members],
      ["acara", events],
      ["Cross", crossGroups],
      ["kas", finance],
    ] as const) {
      if (res.error) throw new Error(`Gagal memuat ${what}: ${res.error.message}`);
    }

    const money: AmountRow[] = finance.data ?? [];
    const sum = (type: FinanceType) =>
      money.filter((f) => f.type === type).reduce((a, b) => a + b.amount, 0);
    const income = sum("income");
    const expense = sum("expense");

    return {
      totalMembers: members.count ?? 0,
      activeCrossGroups: crossGroups.count ?? 0,
      monthGatherings: events.data?.length ?? 0,
      totalBalance: income - expense,
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
    const event = one(
      await supabase
        .from("events")
        .select("*")
        .gte("date", now)
        .neq("status", "archived")
        .order("date", { ascending: true })
        .limit(1)
        .single(),
      "ibadah berikutnya"
    );

    if (!event) return null;

    const stewards = rows(
      await supabase.from("steward_assignments").select("*").eq("event_id", event.id),
      "penatalayan"
    );

    // No profile join here: the only caller (the dashboard) already loads the
    // full profile list and resolves names from it, so fetching them again
    // was a second round-trip for data that was thrown away.
    const stewardAssignments = stewards.map(s => mapStewardRow(s));

    return { ...mapEventRow(event), stewardAssignments };
  }

  const { getUpcomingGathering } = await import("./seed");
  return getUpcomingGathering();
}

export async function getFatigueAlerts(): Promise<FatigueAlert[]> {
  if (isSupabaseConfigured()) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();

    // Filter on the EVENT's date, not the assignment row's created_at.
    // created_at is when the row was written — every imported row shares the
    // import timestamp, so filtering on it counted all 216 historical
    // assignments as "this month" and showed everyone serving 10-15x.
    const assignments = rows(
      await supabase
        .from("steward_assignments")
        .select("profile_id, events!inner(date)")
        .gte("events.date", thirtyDaysAgo),
      "beban penatalayan"
    );

    const countMap: Record<string, number> = {};
    (assignments as ProfileIdRow[]).forEach((a) => {
      countMap[a.profile_id] = (countMap[a.profile_id] || 0) + 1;
    });

    const alertIds = Object.entries(countMap)
      .filter(([, count]) => count > FATIGUE_THRESHOLD)
      .map(([id]) => id);

    if (alertIds.length === 0) return [];

    const profiles = rows(
      await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", alertIds),
      "anggota"
    );

    // Map, never spread: the raw row is snake_case, so `{ ...row }` left
    // fullName/createdAt undefined on every alert card.
    return (profiles as ProfileRow[]).map((row) => ({
      member: { ...mapProfileRow(row), serviceCount30d: countMap[row.id] },
      serviceCount: countMap[row.id],
    }));
  }

  const { getFatigueAlerts } = await import("./seed");
  return getFatigueAlerts();
}

/**
 * @param limit 5 suits the dashboard's activity strip; the Audit page passes a
 *   larger number because it is the full trail, not a preview of it.
 */
export async function getRecentActivity(limit = 5): Promise<RecentActivity[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const data = rows(
      await supabase
        .from("audit_logs")
        .select("id,action,timestamp")
        .order("timestamp", { ascending: false })
        .limit(limit),
      "riwayat aktivitas"
    );

    return (data as AuditRow[]).map((log) => ({
      id: log.id,
      description: log.action,
      createdAt: log.timestamp,
    }));
  }

  const { getRecentActivity } = await import("./seed");
  return (await getRecentActivity()).slice(0, limit);
}

/**
 * How many times each person served in the last 30 days, keyed by profile id.
 *
 * Counted from the EVENT's date, not the assignment row's created_at — the
 * same distinction that made the fatigue alerts wrong. Members pages render
 * this as "N× bulan ini", so a stale or invented number is visible to every
 * pengurus.
 */
async function serviceCounts30d(
  supabase: SupabaseClient
): Promise<Record<string, number>> {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const data = rows(
    await supabase
      .from("steward_assignments")
      .select("profile_id, events!inner(date)")
      .gte("events.date", since),
    "jumlah pelayanan"
  );

  const counts: Record<string, number> = {};
  (data as ProfileIdRow[]).forEach((row) => {
    counts[row.profile_id] = (counts[row.profile_id] ?? 0) + 1;
  });
  return counts;
}

export async function getProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const [res, counts] = await Promise.all([
      // is_active marks "on the roster", separate from `status` ("are they
      // attending"). A login that was never a member of Pemuda is is_active
      // false, so it never shows up in the directory or the member count.
      supabase.from("profiles").select(PROFILE_COLUMNS).eq("is_active", true).order("full_name"),
      serviceCounts30d(supabase),
    ]);
    return rows(res, "daftar anggota").map((row) => ({
      ...mapProfileRow(row),
      serviceCount30d: counts[row.id] ?? 0,
    }));
  }

  const { seedProfiles } = await import("./seed");
  return seedProfiles;
}

export async function getProfileById(id: string): Promise<Profile | undefined> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const [res, counts] = await Promise.all([
      supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).single(),
      serviceCounts30d(supabase),
    ]);
    const data = one(res, "profil anggota");
    if (!data) return undefined;
    return { ...mapProfileRow(data), serviceCount30d: counts[data.id] ?? 0 };
  }

  const profiles = await getProfiles();
  return profiles.find(p => p.id === id);
}

export async function getEvents(): Promise<Event[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const data = rows(
      await supabase.from("events").select("*").order("date", { ascending: false }),
      "daftar ibadah"
    );
    return data.map(mapEventRow);
  }

  const { seedEvents } = await import("./seed");
  return seedEvents;
}

export async function getEventById(id: string): Promise<Event | undefined> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const data = one(await supabase.from("events").select("*").eq("id", id).single(), "ibadah");
    return data ? mapEventRow(data) : undefined;
  }

  const events = await getEvents();
  return events.find(e => e.id === id);
}

export async function getStewardsByEvent(eventId: string): Promise<StewardAssignment[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const stewards = rows(
      await supabase.from("steward_assignments").select("*").eq("event_id", eventId),
      "penatalayan"
    );

    const profileIds = [...new Set(stewards.map(s => s.profile_id))];
    const profiles = rows(
      await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", profileIds),
      "petugas"
    );

    const byId = new Map(profiles.map(p => [p.id, mapProfileRow(p)]));
    return stewards.map(s => mapStewardRow(s, byId.get(s.profile_id)));
  }

  const { seedStewards, seedProfiles } = await import("./seed");
  return seedStewards
    .filter(s => s.eventId === eventId)
    .map(s => ({ ...s, member: seedProfiles.find(p => p.id === s.profileId) }));
}

/**
 * Attendance verdicts recorded for one gathering. Mapped rows, never casts.
 *
 * Supabase mode reads public.attendance directly — RLS (migration 0012)
 * already narrows this to committee + a leader over their own members, so
 * no role check is needed here. Demo mode returns []: there is no seed
 * attendance, and an empty list renders the guiding empty state rather
 * than fake ticks nobody recorded.
 */
export async function getAttendanceByEvent(eventId: string): Promise<AttendanceRecord[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const data = rows(
      await supabase
        .from("attendance")
        .select("id,event_id,profile_id,present,note,recorded_at")
        .eq("event_id", eventId),
      "absensi"
    );
    return data.map(mapAttendanceRow);
  }

  return [];
}

/**
 * Profiles allowed to be picked as PIC — committee + active Cross leaders
 * (keputusan Dex, 19 Sep 2026, enforced by migration 0013's trigger).
 *
 * Supabase mode asks list_pic_eligible(), the same function the trigger
 * uses, so the dropdown can never offer someone the database would
 * reject. Demo mode mirrors the rule honestly from the seed: the 8
 * Cross leaders.
 */
export async function getPicEligibleProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();

    const eligible = rows<string>(await supabase.rpc("list_pic_eligible"), "daftar calon PIC");
    if (eligible.length === 0) return [];

    const [res, counts] = await Promise.all([
      supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .in("id", eligible)
        .eq("is_active", true)
        .order("full_name"),
      serviceCounts30d(supabase),
    ]);
    return rows(res, "calon PIC").map((row) => ({
      ...mapProfileRow(row),
      serviceCount30d: counts[row.id] ?? 0,
    }));
  }

  const { seedCrossMemberships, seedProfiles } = await import("./seed");
  const leaderIds = new Set(
    seedCrossMemberships
      .filter((m) => m.role === "leader" && m.isActive)
      .map((m) => m.profileId)
  );
  return seedProfiles.filter((p) => leaderIds.has(p.id));
}

/**
 * Active Cross names per profile, for directory context ("anak siapa").
 * One batched read for the whole list page — never per-card queries.
 */
export async function getProfileCrossNames(): Promise<Record<string, string[]>> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();

    const [membershipsRes, crossesRes] = await Promise.all([
      supabase
        .from("cross_memberships")
        .select("profile_id,cross_id")
        .eq("is_active", true),
      supabase.from("crosses").select("id,name"),
    ]);
    const memberships = rows(membershipsRes, "keanggotaan Cross");
    const crosses = rows(crossesRes, "kelompok Cross");

    const names = new Map(
      (crosses as NameRow[]).map((c) => [c.id, c.name])
    );
    const out: Record<string, string[]> = {};
    for (const m of memberships as MembershipPairRow[]) {
      const name = names.get(m.cross_id);
      if (!name) continue;
      (out[m.profile_id] ??= []).push(name);
    }
    return out;
  }

  const { seedCrossMemberships, seedCrosses } = await import("./seed");
  const names = new Map(seedCrosses.map((c) => [c.id, c.name]));
  const out: Record<string, string[]> = {};
  for (const m of seedCrossMemberships) {
    if (!m.isActive) continue;
    const name = names.get(m.crossId);
    if (!name) continue;
    (out[m.profileId] ??= []).push(name);
  }
  return out;
}

export async function getCrosses(): Promise<Cross[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const data = rows(
      await supabase.from("crosses").select("*").eq("is_active", true),
      "kelompok Cross"
    );
    return data.map(row => mapCrossRow(row));
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

    const memberships = rows(
      await supabase
        .from("cross_memberships")
        .select("profile_id")
        .eq("cross_id", crossId)
        .eq("is_active", true),
      "anggota Cross"
    );

    const ids = [...new Set((memberships as ProfileIdRow[]).map((m) => m.profile_id))];
    if (ids.length === 0) return [];

    const profiles = rows(
      await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids).order("full_name"),
      "profil anggota Cross"
    );

    return profiles.map(mapProfileRow);
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

    const memberships = rows(
      await supabase
        .from("cross_memberships")
        .select("profile_id")
        .eq("cross_id", crossId)
        .eq("role", "leader")
        .eq("is_active", true),
      "pemimpin Cross"
    );

    const ids = [...new Set((memberships as ProfileIdRow[]).map((m) => m.profile_id))];
    if (ids.length === 0) return [];

    const profiles = rows(
      await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids),
      "profil pemimpin Cross"
    );
    return profiles.map(mapProfileRow);
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

  // The role lookup stays tolerant on purpose: a failure falls back to
  // "member" (fail closed — fewer buttons), which is the safe direction.
  const [profileRes, { data: appRole }] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).single(),
    supabase.rpc("get_my_app_role"),
  ]);
  const profile = one(profileRes, "profilmu");
  if (!profile) return null;

  return { ...mapProfileRow(profile), appRole: (appRole as Profile["appRole"]) ?? "member" };
}

export type AccountStatus = "pending" | "approved" | "rejected";

export interface AccountApproval {
  userId: string;
  email: string;
  displayName: string | null;
  status: AccountStatus;
  requestedAt: string;
  note: string | null;
}

/**
 * Whether the signed-in account has been let in by an admin.
 *
 * Signing in with Google is a *request*, not membership — an outside account
 * reached the whole database on 19 Ags 2026 purely by completing OAuth. RLS
 * (migration 0010) is what actually stops that; this is the app-layer read so
 * the dashboard can explain the situation instead of rendering empty tables.
 *
 * "rejected" is read from the caller's own approvals row (policy "Own
 * approval row is readable", migration 0010) — no new migration needed. The
 * am_i_approved() RPC stays first so an admin-email login without a row yet
 * still counts as approved instead of pending.
 *
 * Returns "approved" in demo mode: with no Supabase there is no real data to
 * protect, and the seed pages are meant to be browsable.
 */
export async function getMyAccountStatus(): Promise<AccountStatus> {
  if (!isSupabaseConfigured()) return "approved";

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "pending";

  // Tolerant on purpose: if this check itself fails, the visitor is shown
  // the "menunggu persetujuan" screen — fail closed, never fail open.
  const { data: approved } = await supabase.rpc("am_i_approved");
  if (approved === true) return "approved";

  const { data: row } = await supabase
    .from("account_approvals")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  return (row as { status: string } | null)?.status === "rejected"
    ? "rejected"
    : "pending";
}

export interface SessionInfo {
  email: string | null;
  displayName: string | null;
  appRole: AppRole;
}

/**
 * Who is signed in, for the Settings "Akun Saya" card. Separate from
 * getCurrentProfile() because admins often have no profiles row at all
 * (handle_new_user files an approval request, not a profile, since 0010) —
 * this reads the session + role RPC + own approvals row instead.
 */
export async function getMySessionInfo(): Promise<SessionInfo | null> {
  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: appRole }, { data: approval }] = await Promise.all([
    supabase.rpc("get_my_app_role"),
    supabase
      .from("account_approvals")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  return {
    email: user.email ?? null,
    displayName:
      (approval as { display_name: string | null } | null)?.display_name ??
      null,
    appRole: (appRole as AppRole) ?? "member",
  };
}

/**
 * The role every UI gate reads (see lib/roles.ts).
 *
 * null = demo mode, where every control stays visible for preview. In live
 * mode a missing session falls back to "member" — fail closed, so a glitch
 * hides buttons instead of offering ones RLS will refuse.
 */
export async function getMyRole(): Promise<AppRole | null> {
  if (!isSupabaseConfigured()) return null;
  const session = await getMySessionInfo();
  return session?.appRole ?? "member";
}

/** The approval queue. Empty for non-admins — RLS decides, not this code. */
export async function getAccountApprovals(): Promise<AccountApproval[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const data = rows(
    await supabase
      .from("account_approvals")
      .select("user_id,email,display_name,status,requested_at,note")
      .order("requested_at", { ascending: false }),
    "antrean persetujuan akun"
  );

  return (data as ApprovalRow[]).map((r) => ({
    userId: r.user_id,
    email: r.email,
    displayName: r.display_name,
    status: r.status,
    requestedAt: r.requested_at,
    note: r.note,
  }));
}

/** Cross ids the signed-in user actively leads. Empty outside a real session. */
export async function getMyLeaderCrossIds(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const data = rows(
    await supabase
      .from("cross_memberships")
      .select("cross_id")
      .eq("profile_id", user.id)
      .eq("role", "leader")
      .eq("is_active", true),
    "Cross yang kamu pimpin"
  );

  return [...new Set((data as CrossIdRow[]).map((r) => r.cross_id))];
}

/** Leader nicknames for every Cross, keyed by cross id — one query for a list page. */
export async function getAllCrossLeaderNicknames(): Promise<Record<string, string[]>> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const memberships = rows(
      await supabase
        .from("cross_memberships")
        .select("cross_id,profile_id")
        .eq("role", "leader")
        .eq("is_active", true),
      "pemimpin Cross"
    );

    const ids = [...new Set((memberships as ProfileIdRow[]).map((m) => m.profile_id))];
    if (ids.length === 0) return {};
    const profiles = rows(
      await supabase.from("profiles").select("id,nickname").in("id", ids),
      "nama pemimpin Cross"
    );
    const nicknameById = new Map(
      (profiles as NicknameRow[]).map((p) => [p.id, p.nickname])
    );

    return (memberships as MembershipPairRow[]).reduce((acc: Record<string, string[]>, m) => {
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
    const data = rows(
      await supabase.from("cross_memberships").select("cross_id").eq("is_active", true),
      "jumlah anggota Cross"
    );

    return (data as CrossIdRow[]).reduce((acc: Record<string, number>, row) => {
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
    const data = rows(
      await supabase
        .from("finance_transactions")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      "buku kas"
    );
    return data.map(mapFinanceRow);
  }

  const { seedFinance } = await import("./seed");
  return seedFinance;
}

export async function getMeetings(): Promise<Meeting[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const data = rows(
      await supabase.from("meeting_notes").select("*").order("date", { ascending: false }),
      "notulen rapat"
    );
    return data.map(mapMeetingRow);
  }

  const { seedMeetings } = await import("./seed");
  return seedMeetings;
}

export async function getMeetingById(id: string): Promise<Meeting | undefined> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const data = one(await supabase.from("meeting_notes").select("*").eq("id", id).single(), "notulen rapat");
    return data ? mapMeetingRow(data) : undefined;
  }

  const meetings = await getMeetings();
  return meetings.find(m => m.id === id);
}

export { isSupabaseConfigured };
