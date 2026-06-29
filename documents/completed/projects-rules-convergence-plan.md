# Projects + Rules Convergence Plan

## Goal
Make rules always belong to a category/project, then progressively converge Categories + Rules into one integrated planning surface.

## Product Principles
- Rules are scoped to a project.
- Project cards become the primary home for recurring planning.
- Keep UX terse and inline; avoid modal-heavy flows.
- Migrate safely for existing users without data loss.

## Phase 1 — Foundation (start now)
Scope: enforce project ownership for rules and stabilize existing data, with minimal IA changes.

### Backend
- Enforce `category_id` required on rule create/update.
- Validate project ownership (`category.user_id == rule.user_id`) on create/update.
- Backfill existing `rules.category_id IS NULL` to a per-user default project (`General`).
- Prevent deleting a project that still has rules (explicit error).

### Frontend
- Require project selection in rule validation.
- Remove `No category` option from rule editor dropdown.
- Keep current screens separate for now; no IA merge yet.

### Acceptance Criteria
- No new rule can be created or updated without a project.
- Existing uncategorized rules are auto-assigned during startup migration.
- Project deletion is blocked when rules exist.
- Rule editor cannot submit with no project selected.

## Phase 2 — IA Merge (Categories + Rules)
Scope: unify the planning experience.

- Rename Categories UI language to Projects.
- Make project cards expandable to show/edit contained rules inline.
- Add quick-add rule within each project card.
- Keep current Rules screen as compatibility path temporarily (soft deprecation).

## Phase 3 — Cleanup + Consistency
Scope: remove duplicate surfaces and finalize model constraints.

- Remove standalone Rules navigation after parity is complete.
- Optionally harden DB-level non-null constraint for `rules.category_id` (migration script).
- Add project-level counters (`rules`, `pending tasks`, `completed tasks`) to improve scanning.

## Risks and Mitigations
- **Risk:** Users with no categories cannot create rules.
  - **Mitigation:** Keep/create default `General` project in migration.
- **Risk:** Category deletion surprises users.
  - **Mitigation:** Block deletion when rules exist and provide explicit message.
- **Risk:** Mid-migration UI confusion.
  - **Mitigation:** Keep terminology transitions incremental (project wording in rules flow first).

## Rollout Notes
- Ship Phase 1 behind current UI to minimize disruption.
- Validate by testing: existing accounts, fresh accounts, and users with uncategorized legacy rules.
