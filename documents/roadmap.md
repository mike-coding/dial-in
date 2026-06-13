# DIAL-IN Roadmap

## Overview

DIAL-IN is a task management and scheduling app built around **projects**, **rules**, and **tasks**. Projects (called "categories" in the data layer) organize work. Rules live inside projects and auto-generate recurring tasks on a schedule. Manual tasks exist independently. The UI is mobile-first with responsive desktop/tablet layouts.

### Design Principles
- Terse, visual UI — state communicated through layout and visual cues, not labels
- Mobile-first with responsive breakpoints (mobile < 768px, tablet 768–1024px, desktop > 1024px)
- Optimistic updates everywhere — instant local state changes, background sync, revert on failure
- Clean domain separation — rules produce tasks, manual tasks are never retroactively linked to rules

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript 5.7, Tailwind CSS 4, Zustand 5, Vite 6 |
| Backend | FastAPI 0.104, SQLAlchemy, SQLite, python-jose (JWT), bcrypt |
| State | Zustand stores per domain (tasks, categories, rules, events, user, userData) with EventBus coordination |
| Version | 0.0.3 |

---

## Data Model

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| **User** | id, username, password, avatar (emoji) | Auth via JWT + localStorage |
| **UserData** | theme, time_period, show_* filter flags, show_categories (JSON) | Per-user preferences, persisted to backend |
| **Category** (Project) | id, name, icon (emoji), user_id | Product-facing term is "project" |
| **Rule** | id, name, description, rate_pattern, category_id (required), user_id, is_active | Generates tasks on a schedule; always belongs to a project |
| **Task** | id, title, description, category_id, rule_id (provenance only), user_id, is_completed, due_date, end_date | rule_id set exclusively by the rule engine; end_date promotes due_date to start semantics |
| **Event** | id, title, description, category_id, rule_id, user_id, start_time, end_time | Backend CRUD exists; minimal frontend |

---

## Completed Features

### Core
- [x] Auth — register, login, logout with JWT + bcrypt
- [x] Responsive layout — mobile bottom nav, desktop/tablet sidebar drawer
- [x] Background system — nature images with backdrop blur/brightness/contrast
- [x] Centralized versioning via package.json

### Tasks
- [x] Full CRUD with due dates, category assignment, completion toggle
- [x] Expandable task details with inline editing and auto-save (blur, change, collapse)
- [x] Completed tasks separated by visual divider
- [x] Task filtering — by date (today/week/month/upcoming), category visibility, show_undated, show_uncategorized, show_overdue flags
- [x] Filter state persisted in UserData
- [x] Date/time support — datetime-local inputs; adding an end date promotes due date to start date (task becomes event-like)

### Projects (Categories)
- [x] Full CRUD with emoji icon picker (400+ emojis)
- [x] Deletion blocked when rules are assigned
- [x] New projects default to unticked in task-list category visibility
- [x] Category selection in task creation/editing

### Rules & Rule Engine
- [x] Full CRUD with multi-segment rate pattern builder
- [x] Rate pattern encoding — daily (`d#N`), weekly (`w#DAYS`), monthly by date (`m#DATES`), monthly by weekday (`mw#OCC-DAY`), yearly (`y#MONTH-DATE`), with optional month filter (`M#`) and time (`T#`)
- [x] Rules require a project — uncategorized legacy rules auto-migrate to "General"
- [x] Automatic 30-day task generation on rule create/update
- [x] Background scheduler thread (60s interval) for ongoing generation
- [x] Schedule update modes on pattern change: `future_replace_preserve_completed` (default), `all_replace`, `additive_future`
- [x] Schedule preview endpoint — shows delete/create counts before applying
- [x] Changing a rule's category updates its child tasks' categories
- [x] rule_id is provenance only — manual tasks cannot carry one

### User Preferences
- [x] UserData store — theme, time_period, filter flags, category visibility
- [x] Optimistic sync with hasPendingWrites indicator

### Navigation
- [x] Mobile: bottom tab bar (Dash, Tasks, Calendar, Profile)
- [x] Desktop/Tablet: left sidebar drawer
- [x] Tasks section with horizontal sub-nav (Tasks, Categories, Rules)
- [x] SVG icons throughout

---

## Roadmap

### ~~Phase 1 — Projects + Rules Convergence~~ ✅

Completed. Projects and rules are unified on a single surface.

- [x] Rename "Categories" to "Projects" in all UI copy
- [x] Make project cards expandable to show/edit contained rules inline
- [x] Quick-add rule within a project card
- [x] Project-level counters (rules count, pending tasks, completed tasks)
- [x] Standalone Rules nav removed; rules managed entirely within Projects

### Phase 2 — Task Enhancements

- [x] Visual category/project indicators on task cards
- [ ] Rule-generated task visibility — surface source rule info on generated tasks
- [ ] Generated task detachment — allow unlinking a task from its source rule
- [ ] Partial field locking — read-only fields for rule-sourced task attributes
- [ ] Rule editor auto-save (match task editing pattern; remove explicit save button)
- [ ] Priority levels (high/medium/low) with visual indicators
- [ ] Subtasks or progress tracking (percentage completion)

### Phase 3 — Events & Calendar

- [ ] Events frontend — creation and management UI alongside tasks
- [ ] Event-specific patterns (time-range vs due-date)
- [ ] Calendar view — month/week/day with task and event visualization
- [ ] Rules-aware calendar — display generated recurring tasks and future previews
- [ ] Calendar interactions — drag to reschedule, quick-create from date cells
- [ ] Rule generation of events (not just tasks)

### Phase 4 — Dashboard & Analytics

- [ ] Dashboard page (currently placeholder)
- [ ] Task completion metrics across projects
- [ ] Rule effectiveness tracking — opt-in `track_metrics` flag per rule
- [ ] Progress charts (completion rate, trends over time)
- [ ] Project-level analytics and goal tracking

### Phase 5 — Collaboration & Customization

- [ ] Shared calendars (read-only and edit permissions)
- [ ] Shared projects and rule templates
- [ ] Team/group task assignment
- [ ] Theme selector (light, dark, high contrast)
- [ ] Custom color palette and background image selection
- [ ] Font size and accessibility options

### Ongoing

- [ ] Component optimization and performance profiling
- [ ] Conflict resolution for overlapping rules
- [ ] Rule dependencies and conditional logic
- [ ] WCAG 2.1 AA accessibility compliance

---

## Architecture

### Frontend Structure
```
front-end/src/
├── components/
│   ├── App.tsx              # Main router + device detection
│   ├── Auth.tsx             # Login/register
│   ├── Drawer.tsx           # Desktop/tablet sidebar
│   ├── MobileNavigation.tsx # Bottom tab nav
│   ├── Tasks.tsx            # Task list with filtering
│   ├── Task.tsx             # Task card
│   ├── TaskDetails.tsx      # Expandable task editor
│   ├── Categories.tsx       # Project management
│   ├── Category.tsx         # Project card
│   ├── Calendar.tsx         # Calendar view (basic)
│   ├── Profile.tsx          # User settings
│   ├── WindowsEmoji.tsx     # Emoji picker
│   └── rules/
│       ├── RuleEditor.tsx   # Multi-segment rule builder
│       ├── RuleItem.tsx     # Rule card display
│       ├── ruleUtils.ts     # Pattern encoding/decoding
│       └── types.ts         # Rule type definitions
├── hooks/
│   ├── useCategories.ts     # Projects store
│   ├── useTasks.ts          # Tasks store
│   ├── useRules.ts          # Rules store
│   ├── useEvents.ts         # Events store
│   ├── useUser.ts           # Auth + user store
│   ├── useUserData.ts       # Preferences store
│   ├── useNavigation.ts     # Navigation context
│   ├── useDeviceDetection.tsx
│   ├── AppContext.tsx        # Data loading coordination
│   ├── eventBus.ts          # Cross-store event coordination
│   ├── apiConfig.ts         # API base URL config
│   └── types.ts             # Shared type definitions
└── utils/
    ├── sharedEmojiOptions.ts
    └── version.ts
```

### Backend Structure
```
back-end/
├── app.py           # FastAPI app, middleware, route registration
├── database.py      # SQLAlchemy engine + session config
├── models.py        # All ORM models
├── rule_engine.py   # Pattern parsing, task generation, background scheduler
└── routes/
    ├── auth.py      # /auth/* — register, login, me, logout
    ├── categories.py # /categories/* — project CRUD
    ├── tasks.py     # /tasks/* — task CRUD, completion toggle
    ├── events.py    # /events/* — event CRUD
    ├── rules.py     # /rules/* — rule CRUD, schedule-preview
    ├── user.py      # /user/* — profile updates
    └── user_data.py # /user-data/* — preferences CRUD
```

---

## Known Issues

- [ ] Rule editor should auto-save like tasks (no explicit save button)

---

## Version History
- **v0.0.3** — Rules engine with rate pattern builder, schedule update modes, task filtering, project-scoped rules
- **v0.0.2** — Task management with expandable details, modern UI, centralized versioning
- **v0.0.1** — Basic authentication and task CRUD

---

*Last updated: April 2, 2026*