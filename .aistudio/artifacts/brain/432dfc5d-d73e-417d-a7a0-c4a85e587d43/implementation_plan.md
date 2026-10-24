# Universal Action Radar — Multi-Workspace Project & EHS Management Plan

Extends the Action Radar dashboard into a unified, multi-workspace project cockpit that manages professional EHS compliance findings alongside creative side projects and daily life milestones. It introduces top workspace switching tabs, adaptive project/facility labels, dual-date cadence tracking, and generalized AI note parsing without losing the fast, single-page glance aesthetic.

> [!IMPORTANT]
> **Confirmed Architectural & Design Decisions (Phase 1 Clarifications):**
> 1. **Top Workspace Tabs**: A master workspace switcher in the header (`All Unified`, `EHS Work`, `Side Projects`, `Personal / Life`) with live count badges to instantly isolate or combine workloads.
> 2. **Adaptive Context Labels**: Metadata fields adapt automatically based on the workspace category:
>    - In **EHS Work**: Labels display `📍 Facility / Plant` (e.g., Plant A, Warehouse 2) and `👤 Site Lead`.
>    - In **Side Projects**: Labels display `🚀 Project / Stream` (e.g., AI Micro-SaaS, Open Source Lib) and `👤 Collaborator / Owner`.
>    - In **Personal / Life**: Labels display `🌱 Focus Area` (e.g., Health, Fin, Home) and `👤 Contact / Vendor`.
> 3. **Dual-Date Cadence Retention**: Keeps the proven two-date workflow across all projects:
>    - 🔴 **Target Milestone / Due Date**: The hard deadline or target completion target.
>    - 🔵 **Next Check-in / Chase Date**: When *you* next sit down to build, review, or nudge a partner/vendor.
> 4. **Zero Action Until Approval**: Per instructions, no code modifications are made until you review and approve this plan.

---

## 1. Overview & Core Concept

- **The Vision**: Professional workflows (EHS compliance, plant audits) and personal initiatives (side projects, apps, certifications, personal goals) share the exact same core challenge: things stall when you only track a final deadline instead of an active chase/check-in cadence.
- **The Solution**: An all-in-one personal cockpit that gives you:
  - **Single Pane of Glass**: See your total daily focus in one glance, or click a single tab to focus strictly on EHS Work during business hours, or Side Projects on evenings/weekends.
  - **No Tool Fragmentation**: Replaces the friction of having Notion/Jira for side projects and spreadsheets for EHS work with a local, private SQLite database.
  - **Universal AI Parsing**: Paste messy notes from GitHub issue discussions, developer chats, personal checklists, or auditor punch lists.

---

## 2. User Experience & Visual Design

### Header & Workspace Switcher Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🛡️ ACTION RADAR]  [ 🌐 All Unified (12) ]  [ 🏭 EHS Work (8) ]  [ 🚀 Side Projects (3) ]  [ 🌱 Life (1) ] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3 KEY STATS: [🔥 P1 Urgent: 4]  [🎯 Chase Today: 5]  [⚠️ Silent >10d: 2]         [📅 .ics Export] [⚙ Reset]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ➕ INLINE QUICK ENTRY                                                                                  │
│ [ Category: Side Projects ▼ ] [ Action / Milestone Description... ] [ Project: Mobile App ] [ Due ]...│
│ └── [⚡ Paste Messy Notes / Brainstorm / Punch List (AI Extract)]                                       │
├──────────────────────────────────────────────────────────────────────────┬─────────────────────────────┤
│ 📋 ACTIONS & CHASE LIST   [• Focus Today (5) | All (12)]  [Group: Category ▼]│ 📅 HORIZON & SCHEDULE       │
│                                                                          │ 7-Day Ribbon & Mini Calendar│
│ 🚀 SIDE PROJECTS                                                         │                             │
│ [🔥 P1] Launch Beta Landing Page & Auth Flow                             │ 🔴 Due Dates (Milestones)   │
│   Project: AI Studio Applet · Owner: Self · Note: Stripe webhooks pending│ 🔵 Chase / Build Sessions   │
│   🔴 Due: 2026-10-31 (in 7d)  🔵 Next Action: TODAY                      │                             │
│   [✉ Draft Nudge/Follow-up] [📝 Log Note] [✓ Done]                       │ [⬇ Download Calendar .ics]  │
│ ──────────────────────────────────────────────────────────────────────── │                             │
│ 🏭 EHS WORK                                                              │                             │
│ [🔥 P1] Emergency Exit Corridor Blocked by Skids                         │                             │
│   Site: Warehouse 2 · Owner: Sarah Chen · ⚠️ 2d silent                   │                             │
│   🔴 Due: 2026-10-26 (in 2d)  🔵 Chase: TODAY                            │                             │
│   [✉ Draft Nudge Email] [📝 Log Note] [✓ Done]                           │                             │
└──────────────────────────────────────────────────────────────────────────┴─────────────────────────────┘
```

### Visual Enhancements

1. **Workspace Tabs in Top Bar**:
   - Styled with clean industrial segmented badges:
     - `🌐 All Unified` (Neutral Slate)
     - `🏭 EHS Work` (Safety Amber / Rose)
     - `🚀 Side Projects` (Electric Violet / Indigo)
     - `🌱 Personal` (Emerald / Sky)
2. **Category Indicator Badges on Cards**:
   - Quiet, unboxed text kickers (`🚀 Side Project` or `🏭 EHS Work`) providing clear visual differentiation.
3. **Adaptive Context Icons & Labels**:
   - Automatically switches icons from `MapPin` (for Plant/Site) to `Rocket` / `FolderGit` (for Side Projects) to `Leaf` (for Personal).

---

## 3. Technical Changes to Implement Upon Approval

### 1. Database Schema Extension (`server/db.ts`)
- Add `category` column to `actions` table with default value `'work'`:
  ```sql
  ALTER TABLE actions ADD COLUMN category TEXT DEFAULT 'work';
  ```
  Allowed values: `'work'` (EHS & Operations), `'side_project'` (Side Projects / Tech), `'personal'` (Life & Habits).
- Seed realistic sample items for side projects (e.g., *"Deploy v1 API to Cloud Run"*, *"Record demo walkthrough video"*, *"Review open PR on GitHub"*) alongside EHS findings.

### 2. Gemini AI Ingestion Generalization (`server/gemini.ts`)
- Enhance the AI extraction prompt to recognize whether raw pasted text is an EHS audit finding, a side project development roadmap, or a personal task.
- Automatically assigns `category: 'work' | 'side_project' | 'personal'` and extracts appropriate project names.
- For side project nudges: drafts professional collaboration/contractor check-in emails or self-reminder briefs.

### 3. Frontend Workspace Navigation (`App.tsx` & `InlineQuickAdd.tsx`)
- Add the master workspace switcher buttons in the header.
- Add category dropdown in the inline quick-add row (`EHS Work`, `Side Project`, `Personal`).
- Update `CompactActionRow.tsx` to render adaptive icons and project labels.
- Add "Group by Category" to the existing Group By dropdown (`Group by Workspace Category`).
