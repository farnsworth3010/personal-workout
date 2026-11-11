# Implementation Plan: Personal Workout App (v1)

**Branch**: `001-workout-app` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md) | **Status**: approved by the owner on 2026-11-11

**Input**: Feature specification from `/specs/001-workout-app/spec.md`

## Summary

A client-only installable PWA for running and tracking workouts at home and in the gym. React SPA
in Feature-Sliced Design, per-user data in Firestore behind security rules, exercise catalog and
photos as static assets, a running session kept in a locally persisted store so it survives
reloads and works offline. Screens follow the approved HTML prototypes in
`../personal-workout-design/`. Decisions and their sources are in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (strict), Node 24.22.2 LTS for tooling

**Primary Dependencies**: React, Vite 8, React Router (data mode), TanStack Query 5, Zustand 5,
Firebase JS SDK 13 (Auth, Firestore), Tailwind CSS 4, shadcn/ui on Radix UI, Recharts (shadcn
Charts), vite-plugin-pwa 2. Full approved list: `docs/research/tooling-2026-11-11.md`.

**Storage**: Firestore under `/users/{uid}` with a persistent local cache; static catalog under
`public/catalog/`; running session in `localStorage`. See [data-model.md](./data-model.md).

**Testing**: Vitest (unit, node and jsdom projects), Testing Library (session scenarios),
`@firebase/rules-unit-testing` on the Firestore emulator, Playwright (mobile and desktop projects)
against the Auth and Firestore emulators.

**Target Platform**: evergreen browsers; installed PWA on iOS 16.4+ and Android; Firebase Hosting.

**Project Type**: single-page web application, no backend code.

**Performance Goals**: every session interaction responds within 100 ms on a mid-range phone,
online or offline (SC-003); session timers within 1 s of true elapsed time after resume (SC-005).

**Constraints**: Spark plan only (no Cloud Functions, no Cloud Storage; 50K reads and 20K writes
per day; Hosting 360 MB/day); no awaited network call inside a session; one dark theme on tokens;
Russian interface; pnpm 12.17.0 with the supply-chain settings of research R9.

**Scale/Scope**: a household of up to 5 users; 10 routes; 876 catalog exercises; 4 Firestore
document kinds.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Owner-controlled development | Owner decided R1, R3 and the data model; R7 deferred by the owner; no dependency outside the approved list | PASS |
| II. Feature-Sliced Design | Structure below; Steiger recommended config in the checks | PASS |
| III. The workout is never interrupted | No awaited writes (R2); timers from timestamps; session store persisted; wake lock (R4) | PASS |
| IV. Free-tier, client-only Firebase | No Functions or Storage; photos served as Hosting assets (R1); rules are the only boundary (R8) | PASS |
| V. Scope discipline | Only spec FR-001..043; backlog items absent from the data model and routes | PASS |
| VI. Themeable dark UI | Tokens from `card.html` become the shadcn CSS variables; no literal colours (lint rule) | PASS |
| VII. Enforced code quality | ESLint, Prettier, Steiger, commitlint in Lefthook and CI; test layers defined | PASS |
| VIII. Supply-chain safety | pnpm settings R9; SHA-pinned actions; pinned `dlx` tools; `firebase-tools` from dev dependencies | PASS |

Re-check after design: no violations; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-workout-app/
├── plan.md              # this file
├── research.md          # decisions and alternatives
├── data-model.md        # Firestore documents, static assets, derived values
├── quickstart.md        # how to run and validate
├── contracts/
│   ├── firestore-access.md   # security rules contract and required tests
│   └── routes.md             # routes, pages, prototypes
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
public/
└── catalog/                 # generated, not committed: exercises.json, images/<id>/{0,1}.jpg
    └── templates.json       # ready-made sets, committed
scripts/
├── fetch-catalog.ts         # pinned dataset commit → cache, verified against the manifest
├── catalog-manifest.sha256  # checksums of every dataset file
└── build-catalog.ts         # dataset → catalog JSON (kind, equipment overrides)
src/
├── app/                     # entry, layout (providers, auth gate, shell), routes, styles (tokens)
├── pages/
│   ├── login/
│   ├── today/               # today's set, week, schedule sheet
│   ├── templates/
│   ├── template-edit/
│   ├── exercises/
│   ├── session/             # exercise card, rest and logging, postponed list, quick add
│   ├── finish/              # summary and survey
│   ├── stats/               # muscle figure, calendar, progress, body charts
│   └── settings/
├── widgets/
│   ├── app-nav/             # bottom bar / sidebar
│   └── exercise-details/    # description sheet and panel (exercises, session, template-edit)
├── features/
│   └── pick-exercise/       # catalog search sheet (template-edit, session quick add)
├── entities/
│   ├── exercise/            # catalog loading, types, gym mark
│   ├── template/            # types, queries, duration and place derivation
│   ├── workout/             # types, queries, volume, records, muscle load
│   ├── session/             # running-session store, prediction, timers
│   └── profile/             # profile document, equipment, defaults
└── shared/
    ├── api/                 # firebase init, db, auth, converters
    ├── ui/                  # shadcn components, value-strip, hold-button, sheet, toast
    ├── lib/                 # time formatting, audio, wake lock, schema helpers (at most 15 modules)
    └── config/
tests/
└── rules/                   # Firestore rules tests
e2e/                         # Playwright scenarios (mobile and desktop projects)
firestore.rules, firebase.json, pnpm-workspace.yaml, steiger.config.ts, lefthook.yml
.github/workflows/           # ci.yml, deploy.yml
```

**Steiger constraints found in Phase 1** (dry run of this layout, `docs/research/phase1-scaffold-report.md`):

- Entity names are singular: the settings entity is `entities/profile`. `providers`, `hooks`, `types`
  and `components` are rejected as segment names: providers live in `app/layout`; slices use `ui`,
  `model`, `api`, `lib`, `config`.
- An entity may import another entity only through an `@x` public API
  (`entities/exercise/@x/workout.ts`); this is needed for workout → exercise and session → workout.
- Every page has segments (`ui/`, `model/`); `shared` folders have an `index.ts`; shadcn components
  stay flat files in `shared/ui`.
- `fsd/insignificant-slice` is a warning during phases 2–10 (owner's decision, 2026-11-11), because
  slices are built one phase before their second consumer; it becomes an error again in Phase 11.
- End-to-end tests run on Chromium only (owner's decision); Safari is checked by hand on the
  owner's iPhone.

**Structure Decision**: one Vite project. FSD v2.1 "pages first": a slice below `pages` exists
only because at least two pages use it (the list above already satisfies that); anything else
stays inside its page. Unit tests sit next to the code they test.

## Implementation Phases

Each phase ends with the checks green and the diff left unstaged for the owner's review. Phases
3–5 share the entities from phase 1–2 and can be split between parallel agents by page.

| # | Phase | Delivers | Spec |
|---|---|---|---|
| 0 | Scaffold and tooling | Vite app, pnpm 12 settings, TypeScript, ESLint, Prettier, Steiger, Lefthook, commitlint, Vitest, Playwright, Tailwind, shadcn init with tokens from `card.html`, approved agent skills, emulator config | constitution VII, VIII |
| 1 | Shell, sign-in, profile | Firebase init with offline cache, auth gate, Google sign-in (device test of R3), navigation, settings page, security rules and their tests | US2, US8 (settings) |
| 2 | Catalog | `fetch-catalog` and `build-catalog` scripts, checksum manifest, exercises page, details widget, equipment profile and gym mark | US3 |
| 3 | Sets and schedule | Ready-made sets, templates page, editor, pick-exercise feature, today page with week and schedule | US4, US5 |
| 4 | Session | Session store, card, timers, rest and logging strips, prediction, hold buttons, postponed list, quick add, resume after reload, wake lock | US1 |
| 5 | Finish and statistics | Summary and survey, exercise stats cache, statistics page with muscle figure and charts | US1 (end), US6 |
| 6 | PWA and offline | Manifest, service worker, photo cache, update prompt, offline end-to-end scenario | US7 |
| 7 | Sounds and animations | Signals, transitions, reduced motion, switches | US8 |
| 8 | CI and deploy | `ci.yml` (lint, types, Steiger, unit, rules, e2e, build, audits), `deploy.yml` once the owner decides the deploy method (R7) | Technical Constraints |

## Owner's decisions on this plan (2026-11-11)

1. Photos are downloaded at build time from a pinned dataset commit and verified against a
   committed checksum manifest (research R1).
2. Sign-in by redirect with the app's own `authDomain`, popup as fallback after a device test (R3).
3. Data model accepted: one document per workout, `exerciseStats` as a derived cache, ready-made
   sets as static JSON ([data-model.md](./data-model.md)).
4. Deploy method: deferred (R7). `ci.yml` is built in phase 8; `deploy.yml` waits for the decision.

## Complexity Tracking

No constitution violations.
