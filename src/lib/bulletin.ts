import { isSupabaseConfigured } from "./supabase/env";
import { SLOT_NEEDS } from "./stewards";
import { isStewardRole } from "./validation";
import type { EventStatus, EventType } from "./types";

/**
 * The public bulletin: everything the front page may show a visitor who is
 * not signed in.
 *
 * Guests cannot read `events`, `crosses` or `steward_assignments` (RLS
 * is_approved()), so the front page reads them through ONE read-only RPC,
 * `public_bulletin()` (migration 0016). It returns bulletin fields only —
 * dates, themes, counts — never a member's name, id or number.
 *
 * The client here is deliberately cookie-less: the answer is the same for
 * every visitor, so the page can be cached and revalidated instead of being
 * rendered per request.
 */

export interface BulletinEvent {
  date: string;
  theme: string;
  type: EventType;
  status: EventStatus;
  /** Only present for published events — drafts may carry internal notes. */
  speaker: string | null;
  description: string | null;
  /** Assigned stewards per role. Counts only, no names. */
  roles: Record<string, number>;
}

/**
 * When Cross groups meet — never which groups. Real group names are their
 * leaders' names, so they stay behind login (migration 0017).
 */
export interface CrossSlot {
  day: string | null;
  time: string | null;
  groups: number;
}

export interface PublicBulletin {
  upcoming: BulletinEvent[];
  latest: { date: string; theme: string; type: EventType } | null;
  crossSchedule: CrossSlot[];
  counts: { events: number; assignments: number; members: number; crosses: number };
  /** Where the numbers came from — the page labels demo data as such. */
  source: "live" | "demo";
}

/** What the page renders when the RPC fails: honest emptiness, no numbers. */
export const EMPTY_BULLETIN: PublicBulletin = {
  upcoming: [],
  latest: null,
  crossSchedule: [],
  counts: { events: 0, assignments: 0, members: 0, crosses: 0 },
  source: "live",
};

/** Narrow the RPC's jsonb into the typed shape; anything malformed is dropped. */
export function parseBulletin(raw: unknown): PublicBulletin | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);

  const upcoming: BulletinEvent[] = Array.isArray(r.upcoming)
    ? r.upcoming.flatMap((e): BulletinEvent[] => {
        if (!e || typeof e !== "object") return [];
        const o = e as Record<string, unknown>;
        const date = str(o.date);
        const theme = str(o.theme);
        if (!date || !theme) return [];
        const roles: Record<string, number> = {};
        if (o.roles && typeof o.roles === "object") {
          for (const [k, v] of Object.entries(o.roles as Record<string, unknown>)) {
            roles[k] = num(v);
          }
        }
        return [{
          date,
          theme,
          type: (str(o.type) ?? "worship") as EventType,
          status: (str(o.status) ?? "draft") as EventStatus,
          speaker: str(o.speaker),
          description: str(o.description),
          roles,
        }];
      })
    : [];

  let latest: PublicBulletin["latest"] = null;
  if (r.latest && typeof r.latest === "object") {
    const l = r.latest as Record<string, unknown>;
    const date = str(l.date);
    const theme = str(l.theme);
    if (date && theme) latest = { date, theme, type: (str(l.type) ?? "worship") as EventType };
  }

  const crossSchedule: CrossSlot[] = Array.isArray(r.cross_schedule)
    ? r.cross_schedule.flatMap((c): CrossSlot[] => {
        if (!c || typeof c !== "object") return [];
        const o = c as Record<string, unknown>;
        const groups = num(o.groups);
        if (groups <= 0) return [];
        return [{ day: str(o.day), time: str(o.time), groups }];
      })
    : [];

  const c = (r.counts && typeof r.counts === "object" ? r.counts : {}) as Record<string, unknown>;

  return {
    upcoming,
    latest,
    crossSchedule,
    counts: {
      events: num(c.events),
      assignments: num(c.assignments),
      members: num(c.members),
      crosses: num(c.crosses),
    },
    source: "live",
  };
}

/**
 * Slots filled out of the weekly minimum (8: WL 1, Singer 2, Pemusik 1,
 * Multimedia 1, Sound 1, Usher 2). Extra people in a role never make up
 * for an empty one — a ninth Pemusik does not cover a missing Usher.
 */
export function slotsFilled(roles: Record<string, number>): { filled: number; needed: number } {
  let filled = 0;
  let needed = 0;
  for (const [role, need] of Object.entries(SLOT_NEEDS)) {
    const target = need.max ?? need.min;
    needed += target;
    const have = isStewardRole(role) ? roles[role] ?? 0 : 0;
    filled += Math.min(have, target);
  }
  return { filled, needed };
}

/**
 * The next weekly youth gathering by the fixed rhythm: Saturday 17:00 WIB
 * (10:00 UTC; WIB has no daylight saving). It stays "this Saturday" until
 * the service has had two hours to finish, so a visitor at 18:00 on the day
 * is not told it is a week away.
 */
export function nextSaturdayService(now: Date = new Date()): Date {
  const d = new Date(now.getTime());
  const day = d.getUTCDay(); // 6 = Saturday
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 10, 0, 0));
  let add = (6 - day + 7) % 7;
  if (add === 0 && now.getTime() > target.getTime() + 2 * 3_600_000) add = 7;
  target.setUTCDate(target.getUTCDate() + add);
  return target;
}

export async function getPublicBulletin(): Promise<PublicBulletin> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data, error } = await supabase.rpc("public_bulletin");
      if (error) return EMPTY_BULLETIN;
      return parseBulletin(data) ?? EMPTY_BULLETIN;
    } catch {
      return EMPTY_BULLETIN;
    }
  }

  // Demo mode (no database configured): derive the same shape from the seed.
  const { seedEvents, seedStewards, seedCrosses, seedProfiles } = await import("./seed");
  const now = Date.now();
  const live = seedEvents.filter((e) => e.status !== "archived");
  const upcoming = live
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 5)
    .map((e): BulletinEvent => {
      const roles: Record<string, number> = {};
      for (const s of seedStewards) {
        if (s.eventId === e.id && s.status !== "replaced") roles[s.role] = (roles[s.role] ?? 0) + 1;
      }
      const published = e.status === "published";
      return {
        date: e.date,
        theme: e.weeklyTheme,
        type: e.eventType,
        status: e.status,
        speaker: published ? e.speakerName : null,
        description: published ? e.description : null,
        roles,
      };
    });
  const past = live
    .filter((e) => new Date(e.date).getTime() < now)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];

  return {
    upcoming,
    latest: past ? { date: past.date, theme: past.weeklyTheme, type: past.eventType } : null,
    crossSchedule: Object.values(
      seedCrosses.reduce<Record<string, CrossSlot>>((acc, c) => {
        const key = `${c.meetingDay}|${c.meetingTime}`;
        acc[key] ??= { day: c.meetingDay || null, time: c.meetingTime || null, groups: 0 };
        acc[key].groups += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.groups - a.groups),
    counts: {
      events: live.length,
      assignments: seedStewards.filter((s) => s.status !== "replaced").length,
      members: seedProfiles.filter((p) => p.status === "active").length,
      crosses: seedCrosses.length,
    },
    source: "demo",
  };
}
