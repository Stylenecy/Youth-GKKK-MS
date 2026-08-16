import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import {
  members,
  skillCategories,
  skills,
  memberSkills,
  crossGroups,
  crossMemberships,
  gatherings,
  stewardAssignments,
  transactions,
  meetings,
  meetingActionItems,
  auditLog,
} from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // ─── Skill Categories ───
  console.log("Creating skill categories...");
  const categories = await db.insert(skillCategories).values([
    { nameEn: "Worship Leadership", nameId: "Pemimpin Pujian", icon: "crown", sortOrder: 1 },
    { nameEn: "Vocal", nameId: "Vokal", icon: "mic", sortOrder: 2 },
    { nameEn: "Musicianship", nameId: "Musik", icon: "guitar", sortOrder: 3 },
    { nameEn: "Multimedia", nameId: "Multimedia", icon: "monitor", sortOrder: 4 },
    { nameEn: "Sound", nameId: "Sound", icon: "volume-2", sortOrder: 5 },
    { nameEn: "Ushering", nameId: "Usher", icon: "hand", sortOrder: 6 },
  ]).$returningId();

  // ─── Skills ───
  console.log("Creating skills...");
  const catWorship = categories[0].id;
  const catVocal = categories[1].id;
  const catMusic = categories[2].id;
  const catMulti = categories[3].id;
  const catSound = categories[4].id;
  const catUsher = categories[5].id;

  const allSkills = await db.insert(skills).values([
    // Worship Leadership
    { categoryId: catWorship, nameEn: "Worship Leader", nameId: "Pemimpin Pujian" },
    { categoryId: catWorship, nameEn: "Co-Leader", nameId: "Co-Leader" },
    // Vocal
    { categoryId: catVocal, nameEn: "Lead Vocal", nameId: "Vokal Utama" },
    { categoryId: catVocal, nameEn: "Backup Vocal", nameId: "Vokal Cadangan" },
    { categoryId: catVocal, nameEn: "Harmony", nameId: "Harmoni" },
    // Musicianship
    { categoryId: catMusic, nameEn: "Drums", nameId: "Drum" },
    { categoryId: catMusic, nameEn: "Keyboard", nameId: "Keyboard" },
    { categoryId: catMusic, nameEn: "Acoustic Guitar", nameId: "Gitar Akustik" },
    { categoryId: catMusic, nameEn: "Electric Guitar", nameId: "Gitar Listrik" },
    { categoryId: catMusic, nameEn: "Bass", nameId: "Bass" },
    // Multimedia
    { categoryId: catMulti, nameEn: "Lyrics Operator", nameId: "Operator Lirik" },
    { categoryId: catMulti, nameEn: "Live Streaming", nameId: "Live Streaming" },
    { categoryId: catMulti, nameEn: "Camera", nameId: "Kamera" },
    // Sound
    { categoryId: catSound, nameEn: "Sound Engineer", nameId: "Sound Engineer" },
    { categoryId: catSound, nameEn: "Monitor Engineer", nameId: "Monitor Engineer" },
    // Ushering
    { categoryId: catUsher, nameEn: "Coordinator", nameId: "Koordinator" },
    { categoryId: catUsher, nameEn: "Greeter", nameId: "Penyambut" },
  ]).$returningId();

  // ─── Cross Groups ───
  console.log("Creating Cross groups...");
  const crossGroupsData = await db.insert(crossGroups).values([
    { name: "Cross Fire", description: "Passionate and on fire for God" },
    { name: "Cross Water", description: "Flowing with God's love" },
    { name: "Cross Air", description: "Spreading the Gospel everywhere" },
    { name: "Cross Earth", description: "Grounded in God's Word" },
  ]).$returningId();

  // ─── Members ───
  console.log("Creating members...");
  const memberData = [
    { fullName: "Aeryn Lim", nickname: "Aeryn", whatsapp: "6281234567890", birthDate: "2001-03-15", hometown: "Jakarta", university: "Universitas Indonesia", cohort: "2020", status: "active" as const, role: "super_admin" as const, isApproved: true },
    { fullName: "Valen Tanaka", nickname: "Valen", whatsapp: "6281234567891", birthDate: "2000-07-22", hometown: "Surabaya", university: "ITS", cohort: "2019", status: "active" as const, role: "committee" as const, isApproved: true },
    { fullName: "Ella Sutanto", nickname: "Ella", whatsapp: "6281234567892", birthDate: "2002-01-10", hometown: "Bandung", university: "ITB", cohort: "2021", status: "active" as const, role: "committee" as const, isApproved: true },
    { fullName: "Jason Wijaya", nickname: "Jason", whatsapp: "6281234567893", birthDate: "2001-11-05", hometown: "Jakarta", university: "BINUS", cohort: "2020", status: "active" as const, role: "member" as const, isApproved: true },
    { fullName: "Michelle Kusuma", nickname: "Michelle", whatsapp: "6281234567894", birthDate: "2003-04-18", hometown: "Medan", university: "Universitas Indonesia", cohort: "2022", status: "active" as const, role: "member" as const, isApproved: true },
    { fullName: "Daniel Pratama", nickname: "Daniel", whatsapp: "6281234567895", birthDate: "2000-09-30", hometown: "Yogyakarta", university: "UGM", cohort: "2019", status: "active" as const, role: "member" as const, isApproved: true },
    { fullName: "Sarah Hermawan", nickname: "Sarah", whatsapp: "6281234567896", birthDate: "2002-06-12", hometown: "Malang", university: "Universitas Brawijaya", cohort: "2021", status: "away" as const, role: "member" as const, isApproved: true },
    { fullName: "Kevin Hartono", nickname: "Kevin", whatsapp: "6281234567897", birthDate: "2001-12-25", hometown: "Semarang", university: "UNDIP", cohort: "2020", status: "active" as const, role: "member" as const, isApproved: true },
    { fullName: "Rachel Susanto", nickname: "Rachel", whatsapp: "6281234567898", birthDate: "2003-02-08", hometown: "Jakarta", university: "BINUS", cohort: "2022", status: "active" as const, role: "member" as const, isApproved: true },
    { fullName: "Brian Lesmana", nickname: "Brian", whatsapp: "6281234567899", birthDate: "2000-05-20", hometown: "Palembang", university: "Universitas Indonesia", cohort: "2019", status: "alumni" as const, role: "member" as const, isApproved: true },
  ];

  const createdMembers = [];
  for (const m of memberData) {
    const [result] = await db.insert(members).values({
      ...m,
      birthDate: m.birthDate ? new Date(m.birthDate) : null,
    }).$returningId();
    createdMembers.push({ id: result.id, ...m });
  }

  // ─── Cross Memberships ───
  console.log("Creating cross memberships...");
  const crossAssignments = [
    { memberIdx: 0, crossIdx: 0 },
    { memberIdx: 1, crossIdx: 0 },
    { memberIdx: 2, crossIdx: 1 },
    { memberIdx: 3, crossIdx: 1 },
    { memberIdx: 4, crossIdx: 2 },
    { memberIdx: 5, crossIdx: 2 },
    { memberIdx: 6, crossIdx: 3 },
    { memberIdx: 7, crossIdx: 0 },
    { memberIdx: 8, crossIdx: 1 },
    { memberIdx: 9, crossIdx: 2 },
  ];

  for (const ca of crossAssignments) {
    await db.insert(crossMemberships).values({
      crossId: crossGroupsData[ca.crossIdx].id,
      memberId: createdMembers[ca.memberIdx].id,
      startDate: new Date("2024-01-15"),
    });
  }

  // ─── Update Cross Leaders ───
  await db.update(crossGroups).set({ leaderId: createdMembers[0].id }).where(eq(crossGroups.id, crossGroupsData[0].id));
  await db.update(crossGroups).set({ leaderId: createdMembers[2].id }).where(eq(crossGroups.id, crossGroupsData[1].id));
  await db.update(crossGroups).set({ leaderId: createdMembers[4].id }).where(eq(crossGroups.id, crossGroupsData[2].id));
  await db.update(crossGroups).set({ leaderId: createdMembers[6].id }).where(eq(crossGroups.id, crossGroupsData[3].id));

  // ─── Member Skills ───
  console.log("Creating member skills...");
  const memberSkillsData = [
    { memberIdx: 0, skillIdx: 0, proficiency: "advanced" as const, primary: true },
    { memberIdx: 0, skillIdx: 3, proficiency: "advanced" as const, primary: false },
    { memberIdx: 0, skillIdx: 6, proficiency: "intermediate" as const, primary: false },
    { memberIdx: 1, skillIdx: 5, proficiency: "advanced" as const, primary: true },
    { memberIdx: 1, skillIdx: 9, proficiency: "intermediate" as const, primary: false },
    { memberIdx: 2, skillIdx: 1, proficiency: "advanced" as const, primary: true },
    { memberIdx: 2, skillIdx: 4, proficiency: "intermediate" as const, primary: false },
    { memberIdx: 3, skillIdx: 7, proficiency: "advanced" as const, primary: true },
    { memberIdx: 3, skillIdx: 8, proficiency: "intermediate" as const, primary: false },
    { memberIdx: 4, skillIdx: 3, proficiency: "advanced" as const, primary: true },
    { memberIdx: 4, skillIdx: 10, proficiency: "intermediate" as const, primary: false },
    { memberIdx: 5, skillIdx: 6, proficiency: "advanced" as const, primary: true },
    { memberIdx: 5, skillIdx: 5, proficiency: "intermediate" as const, primary: false },
    { memberIdx: 7, skillIdx: 2, proficiency: "advanced" as const, primary: true },
    { memberIdx: 7, skillIdx: 7, proficiency: "intermediate" as const, primary: false },
    { memberIdx: 8, skillIdx: 9, proficiency: "intermediate" as const, primary: true },
    { memberIdx: 8, skillIdx: 11, proficiency: "beginner" as const, primary: false },
  ];

  for (const ms of memberSkillsData) {
    await db.insert(memberSkills).values({
      memberId: createdMembers[ms.memberIdx].id,
      skillId: allSkills[ms.skillIdx].id,
      proficiencyLevel: ms.proficiency,
      isPrimary: ms.primary,
    });
  }

  // ─── Gatherings ───
  console.log("Creating gatherings...");
  const gatheringData = [
    { eventDate: "2026-07-05", theme: "Faith Over Fear", description: "Learning to trust God in difficult times", status: "published" as const },
    { eventDate: "2026-07-12", theme: "Walking in Love", description: "Understanding God's love for us and others", status: "draft" as const },
    { eventDate: "2026-07-19", theme: "The Power of Worship", description: "Experiencing God's presence through worship", status: "draft" as const },
    { eventDate: "2026-07-26", theme: "Growing Together", description: "Building community and growing in faith", status: "draft" as const },
  ];

  const createdGatherings = [];
  for (const g of gatheringData) {
    const [result] = await db.insert(gatherings).values({
      eventDate: new Date(g.eventDate),
      theme: g.theme,
      description: g.description,
      status: g.status,
    }).$returningId();
    createdGatherings.push({ id: result.id, ...g });
  }

  // ─── Steward Assignments ───
  console.log("Creating steward assignments...");
  const stewardData = [
    // Gathering 1 - Faith Over Fear (published)
    { gatheringIdx: 0, memberIdx: 0, role: "Worship Leader", status: "confirmed" as const, order: 0 },
    { gatheringIdx: 0, memberIdx: 2, role: "Vocal 1", status: "confirmed" as const, order: 1 },
    { gatheringIdx: 0, memberIdx: 4, role: "Vocal 2", status: "confirmed" as const, order: 2 },
    { gatheringIdx: 0, memberIdx: 5, role: "Keyboard", status: "confirmed" as const, order: 3 },
    { gatheringIdx: 0, memberIdx: 1, role: "Drums", status: "confirmed" as const, order: 4 },
    { gatheringIdx: 0, memberIdx: 7, role: "Multimedia", status: "change_requested" as const, order: 5, changeReason: "Family event" },
    // Gathering 2 - Walking in Love (draft)
    { gatheringIdx: 1, memberIdx: 0, role: "Worship Leader", status: "confirmed" as const, order: 0 },
    { gatheringIdx: 1, memberIdx: 2, role: "Vocal 1", status: "assigned" as const, order: 1 },
    { gatheringIdx: 1, memberIdx: null, role: "Vocal 2", status: "confirmed" as const, order: 2 },
    { gatheringIdx: 1, memberIdx: 5, role: "Keyboard", status: "confirmed" as const, order: 3 },
    { gatheringIdx: 1, memberIdx: null, role: "Drums", status: "confirmed" as const, order: 4 },
    { gatheringIdx: 1, memberIdx: 8, role: "Multimedia", status: "confirmed" as const, order: 5 },
    // Gathering 3 - The Power of Worship (draft)
    { gatheringIdx: 2, memberIdx: 2, role: "Worship Leader", status: "confirmed" as const, order: 0 },
    { gatheringIdx: 2, memberIdx: null, role: "Vocal 1", status: "confirmed" as const, order: 1 },
    { gatheringIdx: 2, memberIdx: null, role: "Vocal 2", status: "confirmed" as const, order: 2 },
    { gatheringIdx: 2, memberIdx: 5, role: "Keyboard", status: "confirmed" as const, order: 3 },
    { gatheringIdx: 2, memberIdx: 1, role: "Drums", status: "confirmed" as const, order: 4 },
    { gatheringIdx: 2, memberIdx: null, role: "Multimedia", status: "confirmed" as const, order: 5 },
  ];

  for (const s of stewardData) {
    await db.insert(stewardAssignments).values({
      gatheringId: createdGatherings[s.gatheringIdx].id,
      memberId: s.memberIdx !== null ? createdMembers[s.memberIdx].id : null,
      roleName: s.role,
      sortOrder: s.order,
      status: s.status,
      changeReason: s.changeReason || null,
    });
  }

  // ─── Transactions ───
  console.log("Creating transactions...");
  const transactionData = [
    { date: "2026-06-05", desc: "Weekly offering", category: "cash_offering" as const, amount: 1250000, type: "income" as const },
    { date: "2026-06-12", desc: "QRIS donations", category: "qris" as const, amount: 850000, type: "income" as const },
    { date: "2026-06-15", desc: "Snacks and drinks", category: "food" as const, amount: 450000, type: "expense" as const },
    { date: "2026-06-19", desc: "Special donation", category: "donation" as const, amount: 2000000, type: "income" as const },
    { date: "2026-06-20", desc: "Sound equipment rental", category: "equipment" as const, amount: 750000, type: "expense" as const },
    { date: "2026-06-26", desc: "Weekly offering", category: "cash_offering" as const, amount: 1100000, type: "income" as const },
    { date: "2026-06-28", desc: "Transport for retreat survey", category: "transport" as const, amount: 350000, type: "expense" as const },
    { date: "2026-07-01", desc: "Welcome gifts for new members", category: "gifts" as const, amount: 280000, type: "expense" as const },
    { date: "2026-07-03", desc: "Weekly offering", category: "cash_offering" as const, amount: 1350000, type: "income" as const },
    { date: "2026-07-03", desc: "Event supplies", category: "event_supplies" as const, amount: 420000, type: "expense" as const },
  ];

  for (const t of transactionData) {
    await db.insert(transactions).values({
      transactionDate: new Date(t.date),
      description: t.desc,
      category: t.category,
      amount: String(t.amount),
      type: t.type,
    });
  }

  // ─── Meetings ───
  console.log("Creating meetings...");
  const [meetingResult] = await db.insert(meetings).values({
    title: "Monthly Committee Meeting - July",
    meetingDate: new Date("2026-07-02"),
    status: "completed",
    agendaData: [
      { id: "1", title: "Opening Prayer", timeAllocation: 5, status: "discussed", order: 0 },
      { id: "2", title: "Review June Activities", timeAllocation: 15, status: "discussed", order: 1 },
      { id: "3", title: "July Theme Planning", timeAllocation: 20, status: "discussed", order: 2 },
      { id: "4", title: "Budget Discussion", timeAllocation: 15, status: "discussed", order: 3 },
      { id: "5", title: "Cross Group Updates", timeAllocation: 10, status: "discussed", order: 4 },
      { id: "6", title: "Closing Prayer", timeAllocation: 5, status: "discussed", order: 5 },
    ],
    notes: "Meeting went well. All agenda items discussed. Key decisions: July theme will be 'Faith Over Fear'. Budget approved for retreat planning.",
  }).$returningId();

  // ─── Meeting Action Items ───
  console.log("Creating action items...");
  await db.insert(meetingActionItems).values([
    { meetingId: meetingResult.id, description: "Prepare retreat venue options", assigneeId: createdMembers[1].id, dueDate: new Date("2026-07-10"), status: "open" },
    { meetingId: meetingResult.id, description: "Confirm worship setlist for July 5", assigneeId: createdMembers[0].id, dueDate: new Date("2026-07-03"), status: "open" },
    { meetingId: meetingResult.id, description: "Update member database", assigneeId: createdMembers[2].id, dueDate: new Date("2026-07-08"), status: "closed" },
  ]);

  // ─── Audit Log ───
  console.log("Creating audit log entries...");
  await db.insert(auditLog).values([
    { actorId: createdMembers[0].id, action: "create", module: "gatherings", recordId: createdGatherings[0].id, recordType: "gatherings", description: "Created gathering 'Faith Over Fear'" },
    { actorId: createdMembers[1].id, action: "create", module: "finance", recordId: 1, recordType: "transactions", description: "Added transaction 'Weekly offering' Rp 1,250,000" },
    { actorId: createdMembers[2].id, action: "update", module: "members", recordId: createdMembers[3].id, recordType: "members", description: "Updated member Jason Wijaya profile" },
    { actorId: createdMembers[0].id, action: "status_change", module: "gatherings", recordId: createdGatherings[0].id, recordType: "gatherings", description: "Changed gathering 'Faith Over Fear' status from Draft to Published" },
  ]);

  console.log("Seed complete!");
}

seed().catch(console.error);
