# Architecture Decision Records

## Decision: Use IndexedDB via Dexie.js for local persistence

**Date:** 2026-03-03

**Status:** Accepted

**Decision:**
Use IndexedDB as the primary local persistence mechanism, wrapped with Dexie.js for TypeScript-friendly API and schema management.

**Reason:**
The application needs offline workout tracking and structured data persistence beyond what localStorage provides.

**Alternatives considered:**
- localStorage — insufficient for structured relational data
- Backend-first — violates offline-first requirement for MVP

**Consequences:**
- Requires storage abstraction layer
- Enables offline-first behavior
- Easier future synchronization with stable entity IDs

---

## Decision: SCSS design tokens without UI framework

**Date:** 2026-03-03

**Status:** Accepted

**Decision:**
Use SCSS with custom design tokens. No Angular Material or other UI framework.

**Reason:**
Custom athletic/premium visual identity. Full control over mobile-first touch targets and workout-specific UI patterns.

**Alternatives considered:**
- Angular Material — generic look, harder to customize for gym UX
- Tailwind CSS — user preference for SCSS tokens

**Consequences:**
- Must build reusable components incrementally
- Complete design control

---

## Decision: Feature-based Angular architecture

**Date:** 2026-03-03

**Status:** Accepted

**Decision:**
Organize code into `core/`, `shared/`, and `features/` with lazy-loaded routes.

**Reason:**
Separates domain concerns from UI. Supports incremental feature development.

**Consequences:**
- Clear boundaries between layers
- Slightly more files per feature

---

## Decision: Plan vs session data separation

**Date:** 2026-03-03

**Status:** Accepted

**Decision:**
`Workout` (plan) and `WorkoutSession` (execution) are separate entities. Historical sessions are never modified when plans change.

**Reason:**
Data integrity for progress tracking, PRs, and future AI analysis.

**Alternatives considered:**
- Single entity with versioning — more complex, harder to query

**Consequences:**
- Session creation copies plan structure at start time
- Plan edits do not affect history

---

## Decision: Signals + services for state management

**Date:** 2026-03-03

**Status:** Accepted

**Decision:**
Use Angular signals and injectable services for state. No NgRx in MVP.

**Reason:**
Lighter weight, Angular-native, sufficient for single-user offline app.

**Alternatives considered:**
- NgRx — overkill for MVP scope

**Consequences:**
- Simpler mental model
- May revisit if multi-user sync adds complexity

---

## Decision: Metric-flexible exercise model

**Date:** 2026-03-03

**Status:** Accepted

**Decision:**
Exercises define `trackingMetrics[]`. Set targets and results use `MetricValue[]`. Do not hard-code weight+reps.

**Reason:**
Supports planks (duration), pull-ups (reps + assistance), running (distance + duration), etc.

**Consequences:**
- UI must render metric inputs dynamically per exercise
- More flexible data model

---

## Decision: Supabase direct client + local-first sync

**Date:** 2026-09-06

**Status:** Accepted

**Decision:**
Use `@supabase/supabase-js` from the Angular PWA with Postgres RLS. Do not introduce a custom REST API for MVP. Keep Dexie as the offline source of truth; sync dirty rows when online. Auth supports email/password and Google OAuth.

**Reason:**
Auth, database, and RLS cover backend needs for a single-user PWA. A custom API would add hosting and duplication without security benefits beyond RLS.

**Alternatives considered:**
- Custom Nest/Express API — deferred until privileged server logic is required
- Online-only Supabase — breaks gym offline usage

**Consequences:**
- Environment must hold URL + anon key (never service_role in the client)
- Conflict resolution is last-write-wins on `updated_at`
- First login claims local `default-user` data

---

## Decision: GitHub remote repository

**Date:** 2026-03-03

**Status:** Accepted

**Decision:**
Use `https://github.com/PrudhviCharanNelloori/GymAssistant.git` as the project remote.

**Reason:**
User-provided repository for version control and collaboration.

**Consequences:**
- All project work pushed to this remote
