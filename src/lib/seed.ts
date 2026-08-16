import type {
  Profile, Event, StewardAssignment, Cross, CrossMembership, FinanceTransaction,
  Meeting, DashboardStats, FatigueAlert, RecentActivity, MonthlyTheme,
} from "./types";

// ============================================================
// DEMO SEED — displayed when Supabase is not configured.
//
// PRIVACY RULE (do not relax without Dex saying so):
// Everything in this file ships in the deployed bundle, and while the
// site runs in demo mode `proxy.ts` lets every /dashboard request
// through without a login. So each name here is world-readable at
// https://youth-gkkk-ms.vercel.app/dashboard/members.
//
// The 8 nicknames below (Dex, Angel, Wangke, Arion, Nita, Grace, Erica,
// Nathan) are the real Cross Leaders — using them here was explicitly
// authorized by Dex on 8 Aug 2026, scoped to NICKNAME ONLY: no surname,
// no birth date, no hometown/university. Do not add any of those back
// without asking again.
//
// WhatsApp numbers: only OBVIOUSLY FAKE ones ever live here — the two
// below normalize to the reserved 6280000 block (see FAKE_NUMBER_PREFIX
// in src/lib/phone.ts) and are stored in raw, unnormalized form on
// purpose, because real numbers come from the importer, which normalizes
// them at write time (scripts/import/import_members.py). Never put a
// real member's number in this file.
//
// Everyone else added through the app (the "tambah anggota" quick-add
// flow) starts with a name and nothing else — that is the point, not a
// gap to fill in later.
// ============================================================

export const seedProfiles: Profile[] = [
  { id: "1", fullName: "Dex", nickname: "Dex", whatsapp: null, birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 3, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
  { id: "2", fullName: "Angel", nickname: "Angel", whatsapp: null, birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 4, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
  { id: "3", fullName: "Wangke", nickname: "Wangke", whatsapp: "6280000-101-23", birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 2, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
  { id: "4", fullName: "Arion", nickname: "Arion", whatsapp: null, birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 2, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
  { id: "5", fullName: "Nita", nickname: "Nita", whatsapp: null, birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 1, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
  { id: "6", fullName: "Grace", nickname: "Grace", whatsapp: "+62 80000-456-78", birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 1, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
  { id: "7", fullName: "Erica", nickname: "Erica", whatsapp: null, birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 2, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
  { id: "8", fullName: "Nathan", nickname: "Nathan", whatsapp: null, birthDate: null, hometown: null, university: null, cohort: null, status: "active", avatarUrl: null, serviceCount30d: 2, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
];

// ------------------------------------------------------------
// Demo-mode dates are computed relative to today, never hardcoded.
// A fixed date silently expires — see the regression test in
// tests/seed.test.ts if this needs re-explaining.
// ------------------------------------------------------------

/** Nth upcoming Saturday at 17:00 WIB (= 10:00 UTC), the ministry's fixed slot. */
function upcomingSaturday(weeksAhead = 0): string {
  const d = new Date();
  d.setUTCHours(10, 0, 0, 0);
  const daysUntilSat = (6 - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + daysUntilSat + weeksAhead * 7);
  if (daysUntilSat === 0 && weeksAhead === 0 && d.getTime() < Date.now()) {
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return d.toISOString();
}

/** N days before now — for backdated finance rows and activity logs. */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

const MONTH_ID = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  timeZone: "Asia/Jakarta",
});

export const seedMonthlyThemes: MonthlyTheme[] = [
  {
    id: "mt1",
    month: MONTH_ID.format(new Date()),
    year: new Date().getFullYear(),
    theme: "Unchained, Not Unchecked",
    description:
      "Merdeka di dalam Kristus — bebas, tetapi tidak tanpa arah (1 Petrus 2:16)",
  },
];

export const seedEvents: Event[] = [
  {
    id: "e1",
    date: upcomingSaturday(0),
    monthlyThemeId: "mt1",
    weeklyTheme: "Unchained, Not Unchecked",
    eventType: "worship",
    picId: "2",
    speakerName: "Pembicara Tamu",
    description:
      "Ibadah Pemuda di Ruang Hermon — latihan 15:00, ibadah mulai 17:00.",
    status: "published",
    archivedAt: null,
  },
  {
    id: "e2",
    date: upcomingSaturday(1),
    monthlyThemeId: "mt1",
    weeklyTheme: "Bertumbuh Bersama",
    eventType: "cross",
    picId: "7",
    speakerName: null,
    description:
      "Cross — lima kelompok kecil membahas khotbah minggu lalu dan menggali Alkitab bersama.",
    status: "published",
    archivedAt: null,
  },
];

export const seedStewards: StewardAssignment[] = [
  { id: "s1", eventId: "e1", profileId: "3", role: "WL", status: "confirmed", reason: null, createdAt: daysAgo(6) },
  { id: "s2", eventId: "e1", profileId: "1", role: "Musik", status: "confirmed", reason: null, createdAt: daysAgo(6) },
  { id: "s3", eventId: "e1", profileId: "7", role: "Singer", status: "confirmed", reason: null, createdAt: daysAgo(6) },
  { id: "s4", eventId: "e1", profileId: "2", role: "Multimedia", status: "confirmed", reason: null, createdAt: daysAgo(6) },
  { id: "s5", eventId: "e1", profileId: "8", role: "Sound", status: "assigned", reason: null, createdAt: daysAgo(5) },
];

/**
 * The real Cross structure, confirmed by Dex 8 Aug 2026. Named by leader
 * rather than a Cross-1..5 number — no official numbering was given, and
 * inventing one would just be another unverified fact to trip over later.
 *
 * memberCount here is a display cache; the source of truth is always
 * seedCrossMemberships (mirrored in the DB by getCrossMemberCounts()).
 */
export const seedCrosses: Cross[] = [
  { id: "c1", name: "Cross Dex", leaderId: "1", description: "Dipimpin sendiri oleh Dex.", meetingDay: "Sabtu", meetingTime: "19:00", memberCount: 1 },
  { id: "c2", name: "Cross Angel", leaderId: "2", description: "Dipimpin sendiri oleh Angel.", meetingDay: "Sabtu", meetingTime: "19:00", memberCount: 1 },
  { id: "c3", name: "Cross Wangke & Arion", leaderId: "3", description: "Dipimpin bersama oleh Wangke dan Arion.", meetingDay: "Sabtu", meetingTime: "19:00", memberCount: 2 },
  { id: "c4", name: "Cross Nita, Grace & Erica", leaderId: "5", description: "Dipimpin bersama oleh Nita, Grace, dan Erica.", meetingDay: "Sabtu", meetingTime: "19:00", memberCount: 3 },
  { id: "c5", name: "Cross Nathan", leaderId: "8", description: "Dipimpin sendiri oleh Nathan.", meetingDay: "Sabtu", meetingTime: "19:00", memberCount: 1 },
];

/**
 * Who leads (and belongs to) each group. Every row here is a leader row —
 * the whole point of tonight's rollout is that each Cross Leader adds their
 * own members through the app instead of this file being hand-maintained.
 */
export const seedCrossMemberships: CrossMembership[] = [
  { id: "cm1", profileId: "1", crossId: "c1", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
  { id: "cm2", profileId: "2", crossId: "c2", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
  { id: "cm3", profileId: "3", crossId: "c3", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
  { id: "cm4", profileId: "4", crossId: "c3", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
  { id: "cm5", profileId: "5", crossId: "c4", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
  { id: "cm6", profileId: "6", crossId: "c4", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
  { id: "cm7", profileId: "7", crossId: "c4", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
  { id: "cm8", profileId: "8", crossId: "c5", role: "leader", startDate: "2026-07-11T00:00:00Z", endDate: null, isActive: true },
];

export const seedFinance: FinanceTransaction[] = [
  { id: "f1", eventId: "e1", amount: 350000, type: "income", account: "kas_kecil", category: "persembahan_pemuda", description: "Persembahan kas ibadah pemuda", receiptUrl: null, recordedById: "2", createdAt: daysAgo(6) },
  { id: "f2", eventId: "e1", amount: 85000, type: "expense", account: "kas_kecil", category: "konsumsi", description: "Snack latihan penatalayan Sabtu", receiptUrl: null, recordedById: "2", createdAt: daysAgo(6) },
];

export const seedMeetings: Meeting[] = [
  { id: "m1", title: "Penetapan 5 kelompok Cross", date: daysAgo(28), content: "{\"agenda\":[\"Susun kelompok Cross\",\"Pembagian tugas CL\"]}", participants: ["1", "2", "3", "4", "5", "6", "7", "8"], createdAt: daysAgo(28) },
];

export function getDashboardStats(): DashboardStats {
  return {
    totalMembers: seedProfiles.length,
    activeCrossGroups: seedCrosses.length,
    monthGatherings: seedEvents.filter(e => e.status === "published" || e.status === "draft").length,
    monthlyBalance: seedFinance.filter(f => f.type === "income").reduce((a, b) => a + b.amount, 0) -
      seedFinance.filter(f => f.type === "expense").reduce((a, b) => a + b.amount, 0),
  };
}

export function getUpcomingGathering() {
  const now = new Date();
  const future = seedEvents
    .filter(e => new Date(e.date) > now && e.status !== "archived")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  if (!future) return null;
  const stewardAssignments = seedStewards.filter(s => s.eventId === future.id).map(s => ({
    ...s,
    member: seedProfiles.find(p => p.id === s.profileId),
  }));
  return { ...future, stewardAssignments };
}

export function getFatigueAlerts(): FatigueAlert[] {
  return seedProfiles
    .filter(p => p.serviceCount30d > 3)
    .map(p => ({ member: p, serviceCount: p.serviceCount30d }));
}

export function getRecentActivity(): RecentActivity[] {
  return [
    { id: "a1", description: "Wangke mengonfirmasi tugas Worship Leader untuk ibadah Sabtu", createdAt: daysAgo(1) },
    { id: "a2", description: "Erica menyiapkan daftar lagu untuk latihan 15:00", createdAt: daysAgo(1) },
    { id: "a3", description: "Angel mengecek multimedia Ruang Hermon", createdAt: daysAgo(2) },
    { id: "a4", description: "Lima kelompok Cross ditetapkan dengan CL masing-masing", createdAt: daysAgo(3) },
  ];
}
