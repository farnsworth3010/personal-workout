<!--
Sync Impact Report
- Version change: template → 1.0.0 (initial ratification) → 1.1.0 (added VIII. Supply-Chain Safety)
- Added principles: I. Owner-Controlled Development; II. Feature-Sliced Design;
  III. The Workout Is Never Interrupted; IV. Free-Tier, Client-Only Firebase;
  V. Scope Discipline; VI. Themeable Dark UI; VII. Enforced Code Quality
- Added sections: Technology Constraints; Development Workflow; Governance
- Removed sections: none
- Templates: ✅ .specify/templates/plan-template.md (generic gate, no change needed);
  ✅ spec-template.md, tasks-template.md (no principle-specific sections to update)
- 1.2.0: testing policy and tooling decided by the owner (TODO(TESTING_POLICY) resolved)
- 1.3.1: trust-policy exceptions are exact versions approved by the owner
- 1.3.0: pnpm 12, 7-day release age, trust policy and pinned dlx tools added to VIII
- 1.2.1: catalog translation deferred to the backlog; emulator and CI deploy recorded
-->

# Personal Workout Constitution

## Core Principles

### I. Owner-Controlled Development (NON-NEGOTIABLE)

- Work proceeds through agreed stages: requirements → design prototypes → spec → plan →
  tasks → implementation. A stage MUST NOT start before the owner approves the previous one.
- The owner makes every key technical decision: libraries, build tool, data model, state
  management, testing. Agents MUST present options and wait for the choice.
- No dependency is installed without the owner's approval. For each technology in use,
  agents MUST look for an official CLI and agent skills and propose them to the owner.
- Agents MUST NOT stage or commit; the owner reviews diffs in the working tree.

Rationale: the owner is a React developer who follows and steers the development.

### II. Feature-Sliced Design

- Source code follows FSD layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- A module imports only from layers below it and only through a slice's public API.
- Cross-imports between slices of the same layer are forbidden.

### III. The Workout Is Never Interrupted

- During a session, no screen may block progress: logging happens on the rest screen with
  quick-tap buttons prefilled from the previous result, and leaving them untouched is valid.
- Session timers MUST keep running through logging, navigation and loss of connectivity.
- A session MUST work offline and sync later. The app is an installable PWA.
- Session screens are designed for a phone held in one hand first, then adapted to desktop.

### IV. Free-Tier, Client-Only Firebase

- The backend is Firebase on the Spark plan: Hosting, Auth, Firestore. Cloud Functions and
  Cloud Storage MUST NOT be used.
- Each user's data lives under that user in Firestore. Firestore security rules MUST deny
  access to another user's data; client-side checks are not a security boundary.
- Exercise catalog data and photos ship as static hosting assets.

### V. Scope Discipline

- Only requirements in `docs/requirements.md` are built. Backlog items (template sharing,
  family) MUST NOT be implemented or pre-architected until the owner pulls them in.
- The simplest solution that fully meets the requirement wins; abstractions and options
  nobody asked for are rejected in review.

### VI. Themeable Dark UI

- The app ships one dark theme. Every colour comes from design tokens (CSS variables);
  hard-coded colours in components are forbidden, so further themes can be added later.
- UI is built with shadcn/ui and Tailwind CSS.
- Interface text is in Russian. Exercise catalog data stays in English until the owner
  pulls its translation from the backlog.

### VII. Enforced Code Quality

- ESLint, the code formatter and the commit message linter MUST pass before work is handed
  to the owner.
- Everything written into the repository (code, comments, docs, commit messages) is in
  English. Comments are short and explain only a non-obvious why.
- Testing: Vitest unit tests for logic (set prediction, statistics, timers), Firestore
  security rules tests on the emulator, Testing Library tests for the key session
  scenarios, and a Playwright end-to-end scenario (sign in → run a workout → see statistics)
  in a mobile and a desktop viewport. New logic ships with its tests.

### VIII. Supply-Chain Safety

- pnpm 12 is the only package manager; pnpm (12.17.0 at ratification) and Node (24 LTS)
  are pinned in the repository.
- The lockfile is committed and installs are frozen against it.
- Dependency install scripts are blocked unless the package is explicitly allow-listed.
- A package version is not installed before it is 7 days old (strict mode), a version
  whose publisher trust dropped is rejected, and versions are saved exact. An exception is
  an exact-version entry approved by the owner and commented in `pnpm-workspace.yaml`.
- Tools run through `npx`/`dlx` (skills installers, MCP servers) are pinned to an exact
  version; `@latest` is forbidden.
- Every new dependency is approved by the owner (Principle I) with its purpose stated.

## Technology Constraints

- React, Feature-Sliced Design, shadcn/ui, Tailwind CSS, Firebase (Spark plan).
- Exercise catalog: free-exercise-db (Unlicense), in English for now.
- Local development and tests use the Firebase emulator. Deploys run in GitHub Actions on
  push to `main` after the checks pass.
- Vite, TypeScript, React Router, TanStack Query (Firestore data), Zustand (running
  session), shadcn Charts on Recharts.
- ESLint + Prettier, Steiger for FSD boundaries, Lefthook + commitlint (Conventional
  Commits), Vitest, Testing Library, Playwright.
- vite-plugin-pwa for the PWA. The approved dependency list is in the plan; exact pnpm 12
  setting keys are recorded there.

## Development Workflow

- Spec Kit drives the work: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`, each output approved by the owner.
- Implementation tasks are executed by Opus agents; the lead agent coordinates and reports.
- Design prototypes are plain HTML files in the sibling `personal-workout-design` folder,
  in mobile and desktop versions, approved by the owner before the spec is written.
- Git settings are changed only with `git config --local`.

## Governance

- This constitution supersedes other practices in the repository. `CLAUDE.md` holds runtime
  guidance and MUST NOT contradict it.
- Amendments require the owner's approval and a version bump: MAJOR for removed or redefined
  principles, MINOR for added principles or sections, PATCH for clarifications.
- Every plan MUST pass a Constitution Check against the principles above; a violation is
  either removed or justified in the plan's Complexity Tracking and approved by the owner.

**Version**: 1.3.1 | **Ratified**: 2026-11-11 | **Last Amended**: 2026-11-11
