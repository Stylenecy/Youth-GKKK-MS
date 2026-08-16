# 🚀 YGMS ULTIMATE MASTER BLUEPRINT (Consolidated Version)
> **Single Source of Truth.** This document is the absolute canonical source for the Youth GKKK Management System (YGMS). It merges the foundational vision of the Volume series with the detailed execution plan of v3.0.

---

## PART 1: FOUNDATION & MINISTRY CONTEXT

### 1.1 Vision & Mission
**Vision:** Build the "Digital Home & Operating System" of GKKK Youth Ministry (Space Youth).
**Mission:** 
- Preserve ministry history and organizational memory.
- Streamline weekly operations and reduce repetitive administrative work.
- Support future committee generations without forcing rigid workflows.
- Replace fragmented spreadsheets, chats, and manual documents with a centralized platform.
- Provide members with a modern, inspiring digital experience.

### 1.2 Core Philosophy (Non-Negotiable Rules)
1. **Event-First:** The Saturday Gathering is the center. Every other module supports it.
2. **History-First:** Data is NEVER hard-deleted. Use `is_active`, `archived_at`, or history tables. Former members and committees remain visible and searchable.
3. **Ministry-First:** Technology follows ministry. Never force the ministry to adapt to software unnecessarily.
4. **Collaboration-First:** Committee members can back up each other. Roles represent responsibility, not strict ownership.
5. **Audit-First:** Every important change has an audit trail. Transparency is preferred over excessive restrictions.
6. **Practicality-First:** Beautiful enough that members enjoy it, practical enough that committee members rely on it weekly.

### 1.3 Ministry Rhythm & Context
- **Main Gathering:** Saturday @ 17:00.
- **Rehearsals:** Wednesday @ 19:00 and/or Saturday @ 15:00.
- **Meetings:** Flexible, no fixed schedule.
- **Planning:** Monthly themes are planned months ahead; weekly themes derive from them.
- **Event Types:** Worship, Cross, Talkshow, Movie Night, Sports, Retreat, Special Events.
- **Organization:** Led by a Coach (Ko Martin) and a Committee (Chairman, Secretary, Treasurer, Worship Team, Publication & Documentation). One person may hold multiple positions.

---

## PART 2: BUSINESS PROCESS & ENTITY ARCHITECTURE

### 2.1 Saturday Gathering (The Core Engine)
**Lifecycle:** Meeting $\rightarrow$ Theme Planning $\rightarrow$ Event Creation $\rightarrow$ Steward Assignment $\rightarrow$ Publish $\rightarrow$ Confirmation $\rightarrow$ Saturday Gathering $\rightarrow$ Finance $\rightarrow$ Archive.

**Steward Assignment Flow:**
- `Assigned`: Committee assigns a member.
- `Confirmed`: Default status. Member is assumed available unless urgent.
- `Change Requested`: Member requests replacement due to urgency (must provide reason).
- `Replaced`: Committee approves and assigns a replacement.
- *Note: "Declined" status is avoided to reduce friction.*

**Anti-Burnout Feature (Steward Fatigue Detection):**
- System tracks service count per member per 30 days.
- If $>$ 3 times in a month, trigger a warning on the Dashboard: "Member X has served 3x this month, consider Member Y."

### 2.2 People & Hierarchical Skills
**Member Profile:** Full Name, Nickname, WhatsApp, Birth Date, Hometown, University, Cohort, Status (Active, Away, Alumni, Inactive).
**Hierarchical Skills System:**
- **Categories:** Worship Leadership (WL), Vocal (Singer Lead/BG), Musicianship (Drums, Keyboard, Guitar, Bass, Violin), Multimedia (Lyric, Streaming, Photo/Video), Sound (Operator/Tech), Ushering (Usher, Greeter).
- **Attributes:** `proficiency_level` (Beginner, Intermediate, Advanced), `is_primary` (boolean), `last_used` (auto-update).

### 2.3 Cross Module (Future-Proof for Aug 2026 Revamp)
- **Current:** Each member belongs to one Cross.
- **Future:** Dynamic group creation, Cross Leader roles.
- **Database Rule:** Use a relational table `cross_memberships` with `start_date` and `end_date` instead of a direct `cross_id` in the `members` table to preserve history.

### 2.4 Finance Module (3-Level Clarity)
- **Level 1 (Dashboard Snapshot):** For Leaders/Coach. Total Income, Total Expense, Balance, Monthly Trend.
- **Level 2 (Transaction List):** For Treasurer. Filterable list (Date, Description, Category, Amount, Linked Event).
- **Level 3 (Detail View):** Full breakdown, receipt upload, audit trail.
- **Categories:** 
  - Income: Cash Offering, QRIS, Donation.
  - Expense: Food, Gifts, Event Supplies, Equipment, Transport.

### 2.5 Meeting Module (Secretary's Playground)
- **Features:** Drag & drop agenda builder, rich text note-taking, auto-save (every 3s), "Highlight to create Action Item", emoji support, and PDF export.

---

## PART 3: TECHNICAL MASTER PLAN

### 3.1 Tech Stack
- **Frontend:** Next.js (App Router), React, TypeScript (Strict Mode), Tailwind CSS, shadcn/ui, Framer Motion.
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime, RLS).
- **Forms/Validation:** React Hook Form, Zod.
- **i18n:** `next-intl` (Primary: Bahasa Indonesia, Secondary: English).
- **Deployment:** Vercel.

### 3.2 Database Philosophy
1. **Never Hard Delete:** Use `created_at`, `updated_at`, `archived_at`, `is_active`.
2. **Soft Relationships:** Past event assignments remain intact even if a member's status changes.
3. **Security:** Row Level Security (RLS) enabled on ALL tables. Least privilege.
4. **Audit Trail:** Every significant edit stores: User, Timestamp, Before, and After.

### 3.3 Authentication & Authorization
- **Auth:** Google OAuth. Identity is used ONLY for login. Member profile is linked via internal DB.
- **Approval:** New accounts require Super Admin approval after first login.
- **Roles & RBAC Matrix:**
  | Feature | Member | Committee | Super Admin |
  | :--- | :---: | :---: | :---: |
  | View Landing/Dashboard | ✅ | ✅ | ✅ |
  | View Member Directory | ✅ | ✅ | ✅ |
  | Create/Edit Events | ❌ | ✅ | ✅ |
  | Assign Stewards | ❌ | ✅ | ✅ |
  | Manage Members | ❌ | ❌ | ✅ |
  | Record Finance | ❌ | ✅ | ✅ |
  | Edit Settings/Roles | ❌ | ❌ | ✅ |
  | View Audit Logs | ❌ | ❌ | ✅ |
  | Confirm Stewardship | ✅ | ✅ | ✅ |

### 3.4 Concrete Entity-Relationship (ER) Guide
To ensure database consistency, follow these core entity structures:
- **`profiles`**: `id (pk)`, `full_name`, `nickname`, `whatsapp`, `birth_date`, `hometown`, `university`, `cohort`, `status`, `avatar_url`, `created_at`, `updated_at`.
- **`skills`**: `id (pk)`, `profile_id (fk)`, `category` (Worship, Vocal, etc), `skill_name`, `proficiency_level`, `is_primary`, `last_used`.
- **`events`**: `id (pk)`, `date`, `monthly_theme_id (fk)`, `weekly_theme`, `event_type`, `pic_id (fk)`, `speaker_name`, `description`, `status` (Draft, Published, etc), `archived_at`.
- **`steward_assignments`**: `id (pk)`, `event_id (fk)`, `profile_id (fk)`, `role`, `status` (Assigned, Confirmed, ChangeRequested, Replaced), `reason`, `created_at`.
- **`cross_memberships`**: `id (pk)`, `profile_id (fk)`, `cross_id (fk)`, `start_date`, `end_date`, `is_active`.
- **`finance_transactions`**: `id (pk)`, `event_id (fk)`, `amount`, `type` (Income, Expense), `category`, `description`, `receipt_url`, `recorded_by (fk)`, `created_at`.
- **`meeting_notes`**: `id (pk)`, `title`, `date`, `content (json/rich-text)`, `participants (array)`, `created_at`.
- **`audit_logs`**: `id (pk)`, `user_id (fk)`, `action`, `entity_type`, `entity_id`, `old_value (json)`, `new_value (json)`, `timestamp`.

### 3.4 Engineering Standards
- **Architecture:** Feature-based folder structure. No duplicated business logic.
- **Git Flow:** `main`, `develop`, `feature/*`, `hotfix/*`.
- **Commits:** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- **Definition of Done:** Functional, Responsive, Validated (Zod), Accessible, Logged (Audit), and Documented.

---

## PART 4: EXECUTION ROADMAP

### 4.1 Sprint Roadmap
- **Sprint 0:** Foundation, DB schema, i18n, design system.
- **Sprint 1:** Auth, Layout, Landing Page.
- **Sprint 2:** Dashboard, People Module (Hierarchical Skills).
- **Sprint 3:** Saturday Gathering (Core, Steward Flow, Fatigue Detection).
- **Sprint 4:** Meetings (Secretary Playground), Notifications.
- **Sprint 5:** Finance (Full UI build).
- **Sprint 6:** Cross (Flexible schema for 2026).
- **Sprint 7:** Analytics, Audit Log, Search.
- **Sprint 8:** Polish, Bug fixing, Bilingual finalization.

### 4.2 Backlog & Phase 2 (Deferred)
- Chatbot AI Assistant for navigation/FAQ.
- WhatsApp Integration & Automation.
- Calendar Synchronization.
- AI Steward Recommendation & Announcement Generator.
- QR Attendance.
- Native Mobile App.

---

## PART 5: DECISION LOG & OPEN QUESTIONS
- **Decision:** Light mode for Landing Page to be more welcoming and less "techy".
- **Decision:** No "Declined" status for stewards to reduce friction; use "Change Requested".
- **Open Question:** Final validation of Finance workflow with Valen & Aeryn.
- **Open Question:** Specific worship operational details validation with Ci Ella.
- **Open Question:** Finalizing the Cross revamp policy for August 2026.

**END OF MASTER BLUEPRINT**
