# 🎨 YGMS UI/UX & PAGE SPECIFICATIONS (Consolidated Version)
> **Single Source of Truth for Design.** This document merges the design system and page inventory from v3.0 and the product blueprint from the Volume series.

---

## PART 1: DESIGN SYSTEM (SPACE YOUTH GKKK)

### 1.1 Brand Identity & Visual Vibe
- **Theme:** "Modern Spiritual SaaS" meets "Space/Cosmic".
- **Vibe:** Premium, anti-mainstream, warm but mysterious.
- **Mascot:** Astronaut and Moon (Space Youth).
- **Backgrounds:** Subtle star/constellation patterns.

### 1.2 Color Palette
**Landing Page Default: LIGHT MODE**

**Light Mode (Primary):**
- Background: Off-white with subtle blue tint (`#F8F9FC`)
- Text: Deep Space Gray (`#1A1A2E`)
- Cards: White with subtle glassmorphism

**Dark Mode (Secondary):**
- Background: Deep Space Black (`#0A0A0F`)
- Text: Space White (`#FFFFFF`)
- Cards: Glassmorphism with blur

**Gradient Palette:**
- 🌈 **Aurora (Primary):** `#7C3AED` (Violet) $\rightarrow$ `#EC4899` (Pink) — *Buttons, Highlights*
- 🌈 **Nebula (Cards):** `#3B82F6` (Blue) $\rightarrow$ `#8B5CF6` (Purple) — *Sections*
- 🌈 **Cosmic (Success):** `#10B981` (Emerald) $\rightarrow$ `#3B82F6` (Blue) — *Income, Positive*
- 🌈 **Sunset (Warning):** `#F59E0B` (Amber) $\rightarrow$ `#EF4444` (Red) — *Expense, Alerts*

### 1.3 Typography
- **Headings:** `Satoshi` (Bold/Black)
- **Body:** `Satoshi` (Regular)
- **UI Elements & Numbers:** `Neue Montreal` (Medium/Bold)
- **Fallback:** `Inter`

### 1.4 Shapes, Shadows & Effects
- **Rounded Corners:** Small (8px), Medium (16px), Large (24px), XL (32px).
- **Shadows:** 
  - Sm: `0 2px 8px rgba(0,0,0,0.08)`
  - Md: `0 4px 16px rgba(0,0,0,0.12)`
  - Lg: `0 8px 32px rgba(0,0,0,0.16)`
  - XL: `0 16px 48px rgba(0,0,0,0.20)`
- **Glassmorphism 2.0:** `background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1);`

### 1.5 Micro-Interactions & Motion (Framer Motion)
- **Page Transitions:** Fade-in + slide-up (0.3s ease).
- **Hover States:** Scale 1.02 + shadow increase.
- **Loading:** Shimmer effect (NO spinning loaders).
- **Actions:** Satisfying checkmark animations on save/confirm.

### 1.6 Responsive Strategy
- **Mobile-First (90% users):** Bottom Navigation Bar (glassmorphism), 44px min touch targets, single-column layouts, swipe gestures.
- **Desktop:** Multi-column dashboards, persistent sidebar, keyboard shortcuts.

---

## PART 2: PAGE INVENTORY & DETAILED SPECS

### 2.1 Public Pages (No Login)
1. **Landing Page (`/`)**: 
   - *Sections:* Hero (animated stars), Countdown Widget, Theme Preview (Monthly/Weekly), Event Type Showcase, Steward Highlight, Upcoming Schedule, Daily Verse.
   - *Visual:* Light mode default, Aurora gradients.
2. **Login Page (`/login`)**: 
   - *Sections:* Gradient mesh background, Glassmorphism Login Card, Google Sign-In button.

### 2.2 Committee Dashboard
3. **Dashboard (`/dashboard`)**:
   - *Sections:* Greeting Header, Quick Stats Row (Next Event, Readiness, Pending Confirms, Finance), Next Event Card (Steward grid), Pending Confirmations List, Recent Activity Timeline, Quick Actions Sidebar, Upcoming Meetings, Reliability Alerts.

### 2.3 Saturday Gathering Module
4. **Event List Page (`/events`)**: 
   - *Sections:* Header, Filters Bar (Status, Month, Type, Search), Event Grid (Cards with readiness progress and steward count).
5. **Event Detail Page (`/events/[id]`)**:
   - *Sections:* Header (Breadcrumb, Status), Theme Section, Steward Grid (Avatars + Status), Readiness Checklist, Documentation Gallery, Notes, Event Info Card (PIC, Speaker), Finance Summary, Attendance Stats, Audit Log.
6. **Event Create/Edit Page (`/events/new` or `/edit`)**:
   - *Sections:* Multi-step form:
     - **Step 1 (Basic):** Input `event_name`, `datetime_picker`, `dropdown(event_type)`, `input(location)`, `member_selector(pic)`.
     - **Step 2 (Theme):** `theme_selector(monthly)`, `input(weekly)`, `member_selector(speaker)`, `textarea(description)`.
     - **Step 3 (Stewards):** Preview of roles $\rightarrow$ Quick assign buttons.
     - **Step 4 (Review):** Summary card $\rightarrow$ `Button(Save Draft)` / `Button(Publish)`.
   - *Desktop:* Sidebar preview of the event card updating in real-time.
7. **Steward Assignment Interface (`/events/[id]/assign`)**:
   - *Sections:* Role Cards (Left: Role name, Current steward, Status), Member Pool (Right: Search bar, Skill filters, Member cards with `reliability_score` and `last_served` date).
   - *Interaction:* Drag member card $\rightarrow$ Drop on Role card $\rightarrow$ Trigger "Assigned" status and Notif.

### 2.4 People Module
8. **Member List Page (`/members`)**:
   - *Sections:* Header, Filters, View Toggle (Grid/List), Member Cards (Avatar, Status, Cross, Top Skills, Service Count).
9. **Member Profile Page (`/members/[id]`)**:
   - *Sections:* Header (Large Avatar, Quick Stats), About Section, Hierarchical Skills display, Service History Timeline, Cross History, Statistics Card (By role, Reliability, Streak), Availability toggle.

### 2.5 Finance Module
10. **Finance Dashboard (`/finance`)**:
    - *Sections:* Header, Financial Snapshot (Income, Expense, Balance), Recent Transactions Table, Expense by Category (Pie Chart), Monthly Trend (Bar Chart).
11. **Transaction Detail Page (`/finance/transactions/[id]`)**:
    - *Sections:* Header (Type, Amount), Transaction Info, Receipt Attachments, Audit Trail, Related Transactions.

### 2.6 Meeting Module
12. **Meeting List Page (`/meetings`)**:
    - *Sections:* Header, Filters, Meeting Grid (Date, Title, Participants, Agenda preview).
13. **Meeting Detail Page (`/meetings/[id]`)**:
    - *Sections:* Header, Agenda (Drag & Drop), Rich Text Notes (Secretary's Playground), Decisions List, Action Items Table, Participants Attendance, Attachments.

### 2.7 Cross Module
14. **Cross List Page (`/cross`)**:
    - *Sections:* Header, Cross Grid (Leader, Member count, Next meeting, stacked avatars).
15. **Cross Detail Page (`/cross/[id]`)**:
    - *Sections:* Header, Members List, Cross History Timeline, Upcoming Activities, Cross Info/Stats.

### 2.8 Extended Modules
16. **Analytics Dashboard (`/analytics`)**: Service Frequency, Reliability, Monthly Ministry Trend, Finance Trend, Event Statistics.
17. **Settings Page (`/settings`)**: Profile, Permissions (Role matrix), Ministry Settings (Event types, Roles), Archive.
18. **Search Results Page (`/search`)**: Global search across Members, Events, Meetings, Finance.
19. **Notifications Page (`/notifications`)**: Notification list with filter by type (Steward, Meeting, Finance).
20. **Audit Log Page (`/audit`)**: Log Table (Timestamp, User, Module, Action, Before/After diff).

---

## PART 3: USER JOURNEYS
- **Visitor:** Landing $\rightarrow$ Login.
- **Committee:** Dashboard $\rightarrow$ Event $\rightarrow$ Assignment $\rightarrow$ Confirmation $\rightarrow$ Saturday $\rightarrow$ Archive.
- **Member:** Login $\rightarrow$ View Assignment $\rightarrow$ Confirm $\rightarrow$ Attend.

**END OF UI/UX SPECIFICATIONS**
