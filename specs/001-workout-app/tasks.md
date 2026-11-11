# Tasks: Personal Workout App (v1)

**Input**: Design documents from `/specs/001-workout-app/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: included. The constitution (VII) requires new logic to ship with its tests.

**Organization**: by user story, in an order that respects dependencies: US2 (sign-in) comes
before US1 because nothing can be stored without an account.

## Rules for every task

- Read `CLAUDE.md` and `.specify/memory/constitution.md` first. Screens follow the prototype named
  in the task (`../personal-workout-design/<file>`): layout, states, texts, tokens.
- Install only packages from the approved list (`docs/research/tooling-2026-11-11.md`), exact
  versions, with pnpm. A package outside the list stops the task and goes to the owner.
- No colour literals, no awaited Firestore write in UI code, no code for backlog items.
- A task is done when `pnpm lint`, `pnpm typecheck` and the tests it touches pass. Leave the
  diff unstaged; never commit.
- Steiger constraints: singular entity names, segments only `ui` / `model` / `api` / `lib` / `config`, entity-to-entity imports only through `@x` public APIs, every page has segments (see plan.md "Steiger constraints").
- **[P]** = can run in parallel with other [P] tasks of the same phase (different files).

---

## Phase 1: Setup (scaffold and tooling)

**Purpose**: an empty app with every check wired, before any feature code.

- [x] T001 Pin the toolchain: `package.json` (`devEngines.packageManager` pnpm 12.17.0, `devEngines.runtime` node 24.22.2, `engines`), `.nvmrc`, `.npmrc` (registry only), `pnpm-workspace.yaml` with the settings of research R9
- [x] T002 Scaffold Vite + React + TypeScript (strict) at the repository root: `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/app/index.tsx`, `@/*` alias; add `.gitignore` (`node_modules`, `dist`, `public/catalog/exercises.json`, `public/catalog/images`, `.catalog-cache`, emulator data)
- [x] T003 Create the FSD skeleton `src/{app,pages,widgets,features,entities,shared}` with the segments listed in plan.md and placeholder public APIs only where a slice already has code
- [x] T004 [P] ESLint flat config in `eslint.config.ts` (typescript-eslint, react-hooks, react-refresh, jsx-a11y, @tanstack/eslint-plugin-query, eslint-config-prettier) and Prettier with prettier-plugin-tailwindcss in `prettier.config.js`
- [x] T005 [P] Steiger in `steiger.config.ts` with `fsd.configs.recommended`; add it to `pnpm lint`
- [x] T006 [P] Lefthook in `lefthook.yml` (pre-commit: lint and format on staged files, typecheck; commit-msg: commitlint) and `commitlint.config.js` with config-conventional; add `lefthook` to `allowBuilds` after reviewing its install script
- [x] T007 [P] Vitest in `vitest.config.ts` with projects `unit` (node), `ui` (jsdom + Testing Library setup in `src/shared/lib/test/setup.ts`) and `rules` (node, `tests/rules`)
- [x] T008 [P] Playwright in `playwright.config.ts` with projects `mobile` (390×844, touch) and `desktop` (1280×800), web server = Vite dev + emulators; empty smoke test in `e2e/smoke.spec.ts`
- [x] T009 Tailwind CSS 4 and shadcn/ui init (Radix base, CSS variables) with `components.json`; map the `:root` tokens of `../personal-workout-design/card.html` to the shadcn variables in `src/app/styles/tokens.css`, one dark theme in `:root`
- [x] T010 [P] Firebase emulator setup: `firebase.json` (Auth 9099, Firestore 8080, Hosting config with long cache headers for `/catalog/images/**`), `.firebaserc` with `demo-workout`, deny-all `firestore.rules`
- [x] T011 `package.json` scripts: `dev` (Vite + emulators), `build`, `preview`, `lint`, `typecheck`, `test`, `test:rules`, `e2e`, `catalog`, `check` (all checks + `pnpm audit` + `pnpm audit signatures`)
- [x] T012 [P] Install the approved agent skills with pinned installer versions (shadcn, Firebase, React Router, Feature-Sliced Design, commitlint, Playwright CLI) into `.claude/`; record the exact commands in `docs/skills.md`
- [x] T013 Lint rule or script that fails on colour literals in `src/**` outside `src/app/styles/tokens.css` (constitution VI), wired into `pnpm lint`

**Checkpoint**: `pnpm check` passes on the empty app. Done on 2026-11-11: green from a clean install in 41 s; reports in `docs/research/phase1-*.md`.

---

## Phase 2: Foundational (blocks every user story)

- [x] T014 Firebase init in `src/shared/api/firebase.ts`: app, `auth`, Firestore with `persistentLocalCache` + multi-tab manager, emulator connection in dev and test (research R2)
- [x] T015 [P] Schemas and types of the Firestore documents and converters in `src/shared/api/schema/` (profile, template, workout, exerciseStats) exactly as in data-model.md, with unit tests of validation limits
- [x] T016 [P] `QueryClient` with the defaults of research R2 and a helper that feeds an `onSnapshot` into a query key, in `src/shared/api/query.ts` and `src/app/layout/query-provider.tsx`; unit test of the helper
- [x] T017 [P] Fire-and-forget write helper with a non-blocking error notice in `src/shared/api/write.ts`; unit test that it never returns the server promise
- [x] T018 [P] Shared UI from the prototypes in `src/shared/ui/`: `sheet` (bottom sheet / dialog), `toast`, `chip`, `switch`, `stat-row`, built on shadcn components; add the shadcn components they need
- [x] T019 Dataset fetch in `scripts/fetch-catalog.ts`: `git fetch --depth 1` of free-exercise-db at commit `79ca7b47d77cd5a6dd7a50440e9f0bf24da6a142` into `.catalog-cache/`, verify every file against `scripts/catalog-manifest.sha256`, fail on mismatch; generate the manifest once and commit it (research R1)
- [x] T020 Catalog build in `scripts/build-catalog.ts`: write `public/catalog/exercises.json` and copy images to `public/catalog/images/<id>/`; derive `kind` and apply `scripts/catalog-overrides.json` (timed exceptions, `pull-up bar`) per research R11; unit tests of the derivation
- [x] T021 [P] `entities/exercise`: catalog loader and query, types, `isGymOnly(exercise, homeEquipment)`, muscle and equipment labels in Russian, in `src/entities/exercise/`; unit tests of the gym mark
- [x] T022 [P] `entities/profile`: profile document query, defaults on first read, update mutations, in `src/entities/profile/`
- [x] T023 [P] Ready-made sets in `public/catalog/templates.json` (home without equipment, home with dumbbells and pull-up bar, gym full body, gym push / pull / legs, stretching, cardio; `pairId` for home/gym pairs) and `entities/template` with types, loader, `placeOf`, `estimateDuration`, `muscleGroupsOf` in `src/entities/template/`; unit tests of the derivations; a test that every exercise id exists in the catalog
- [x] T024 Router and app shell in `src/app/routes/` per contracts/routes.md: route table with lazy pages, auth gate placeholder, layout with `widgets/app-nav` (bottom bar and sidebar with the icons of the prototypes) in `src/widgets/app-nav/`

**Checkpoint**: the shell renders empty pages with navigation; the catalog builds. Done on 2026-11-11: `pnpm check` green from a clean copy in 84 s; reports in `docs/research/phase2-wave-reports.md`.

---

## Phase 3: User Story 2 — Sign in and keep my data to myself (P1)

**Goal**: Google sign-in, per-user isolation enforced by rules.

**Independent Test**: quickstart scenario 4.

- [x] T025 [P] [US2] Rules tests in `tests/rules/` covering the five required groups of contracts/firestore-access.md (they fail against the deny-all rules for owner access)
- [x] T026 [US2] `firestore.rules`: `isOwner`, one match per document kind with `valid*` functions, no catch-all write (research R8), until T025 passes
- [x] T027 [US2] Auth in `src/app/layout/auth-provider.tsx` and `src/pages/login/` (`login.html`): `signInWithRedirect` with the app's `authDomain`, redirect result handling, sign-out, auth gate redirects of contracts/routes.md, popup fallback behind one config flag (research R3)
- [x] T028 [US2] Test-only sign-in hook (`signInWithCredential` with an emulator token, compiled only in test mode) in `src/shared/api/test-auth.ts`; Playwright fixture `e2e/fixtures/auth.ts`
- [x] T029 [P] [US2] E2E in `e2e/auth.spec.ts`: signed-out visitor sees only login; after sign-in lands on `/`; sign-out hides data; second account sees none of the first account's data
- [ ] T030 [US2] Device check with the owner: sign-in in the installed app on an iPhone and on Android against a preview build; record the result and the chosen flow in research.md R3

**Checkpoint**: accounts work; rules contract green.

---

## Phase 4: User Story 1 — Run a workout without being interrupted (P1) 🎯 MVP

**Goal**: the full session from start to saved workout, offline-safe.

**Independent Test**: quickstart scenarios 1, 2, 3.

### Logic and tests

- [x] T031 [P] [US1] Prediction in `src/entities/session/model/prediction.ts` (set N from history, fallbacks, weight shift) with unit tests for every rule of data-model.md "Derived values"
- [x] T032 [P] [US1] Timers from timestamps in `src/entities/session/model/timers.ts` (total, exercise, rest remaining, timed countdown) with unit tests including sleep and reload gaps
- [x] T033 [P] [US1] Workout math in `src/entities/workout/model/summary.ts` (volume, sets done, muscle load 1 / 0.5, records, best set by Epley) with unit tests
- [x] T034 [US1] Session store in `src/entities/session/model/store.ts`: Zustand with `persist`; start from a template, log set, next, go back, postpone, resume postponed, quick add (now / next / replace), finish, discard; entry state transitions of data-model.md; unit tests of every transition
- [x] T035 [US1] `entities/workout` API in `src/entities/workout/api/`: write the active workout after each logged set without awaiting, `activeWorkoutId` on the profile, finish writes summary and `exerciseStats`; queries for one workout and for `exerciseStats`

### UI (prototype `card.html`)

- [x] T036 [P] [US1] `hold-button` in `src/shared/ui/hold-button/`: one-second hold with fill on touch, immediate on mouse and keyboard, "Удерживайте" hint; component tests with touch and mouse pointer events
- [x] T037 [P] [US1] `value-strip` in `src/shared/ui/value-strip/`: scrollable strip, tap selects, scroll does not, centring by `scrollLeft`, exact input on tap of the selected value, off-grid value inserted in order, wheel scrolls horizontally; component tests
- [x] T038 [P] [US1] `widgets/exercise-details` in `src/widgets/exercise-details/`: sheet on phones, dialog or panel on desktop, two photos, muscles, equipment, steps
- [x] T039 [P] [US1] `features/pick-exercise` in `src/features/pick-exercise/`: sheet with catalog search and "already in set" marks
- [x] T040 [US1] `pages/session` exercise card in `src/pages/session/ui/`: photos alternating, name, muscles, gym badge, set counter with dots, plan, timers, top bar with finish and progress, navigation row
- [x] T041 [US1] Rest panel in `src/pages/session/ui/rest-panel.tsx`: countdown, "В прошлый раз", reps and weight strips prefilled from the prediction, timed-exercise countdown variant, "Следующий подход"
- [x] T042 [US1] Postponed list in `src/pages/session/ui/postponed.tsx`: "Отложено: N" control, sheet with resume, end-of-queue prompt with "Завершить без них" (states `?postponed`, `?postponed-sheet` of the prototype)
- [x] T043 [US1] Quick add in `src/pages/session/ui/quick-add.tsx` using `features/pick-exercise` with the choice "сейчас / следующим / вместо текущего"
- [x] T044 [US1] Wake lock in `src/shared/lib/wake-lock.ts` (request on session start, re-request on `visibilitychange`, silent failure) and its use in `pages/session`; unit test with a mocked API
- [x] T045 [US1] Session entry points: minimal `pages/today` in `src/pages/today/` with a sheet of ready-made sets to start, "continue workout" when a session is active, "continue or finish" prompt when starting another; `/session` guard
- [x] T046 [US1] `pages/finish` in `src/pages/finish/` (`finish.html`): summary, records, exercise list with skipped ones, survey (1–5 rows, body weight with ± buttons, per-item skip), save, discard prompt for zero sets
- [x] T047 [US1] Component tests of the session scenarios in `src/pages/session/session.test.tsx`: untouched strip saves the prediction; changed weight shifts later sets; postpone and resume keeps logged sets; go back edits a logged set
- [x] T048 [US1] E2E in `e2e/session.spec.ts` (mobile and desktop): quickstart scenarios 1–3, including reload during rest and the hold buttons

**Checkpoint**: MVP — sign in, start a ready-made set, run and save a workout.

---

## Phase 5: User Story 3 — Find exercises that fit where I train (P2)

**Independent Test**: quickstart scenario 5.

- [x] T049 [P] [US3] Catalog filtering in `src/pages/exercises/model/filter.ts` (search with ё = е, muscle group, equipment, home only) with unit tests
- [x] T050 [US3] `pages/exercises` in `src/pages/exercises/` (`exercises.html`): search and filters in the URL, chip rows, home-only switch, list with gym badges, empty state, details sheet on phones and side panel on desktop, "Добавить в набор"
- [x] T051 [US3] Equipment profile in `src/pages/settings/` (`settings.html`): account block with sign-out, equipment checklist, note about the gym mark; other settings blocks are stubs until US8
- [x] T052 [P] [US3] E2E in `e2e/catalog.spec.ts`: quickstart scenario 5

---

## Phase 6: User Story 4 — Use ready-made sets and build my own (P2)

**Independent Test**: quickstart scenario 6, first half.

- [x] T053 [P] [US4] Template API in `src/entities/template/api/`: own templates query, create, copy from ready-made, update, delete
- [x] T054 [US4] `pages/templates` in `src/pages/templates/` (`templates.html`): own and ready-made sections, place filter, start, edit, copy, create
- [x] T055 [US4] `pages/template-edit` in `src/pages/template-edit/` (`template-edit.html`): name, entries with sets, reps or duration, rest, reorder, remove, add through `features/pick-exercise`, gym warning, validation, save and cancel, `?add=<id>` from the catalog
- [x] T056 [P] [US4] Editor logic tests in `src/pages/template-edit/model/editor.test.ts` (reorder, validation limits, reps versus duration by kind)
- [x] T057 [P] [US4] E2E in `e2e/templates.spec.ts`: copy a ready-made set, edit, save, start a workout from it

---

## Phase 7: User Story 7 — Use it like an app, even without a connection (P2)

**Independent Test**: quickstart scenario 8.

- [x] T058 [US7] vite-plugin-pwa in `vite.config.ts` per research R6: manifest with icons in `public/`, precache of the shell and `catalog/exercises.json`, `CacheFirst` for `/catalog/images/**` (600 entries), `navigateFallbackDenylist` for `/__/`
- [x] T059 [US7] Update prompt in `src/app/layout/pwa-update.tsx`, shown only outside a running session; photo placeholder for uncached images in `src/shared/ui/exercise-photo/`
- [x] T060 [US7] Offline notice for failed sync in `src/shared/ui/sync-notice/`; call `navigator.storage.persist()` after sign-in
- [x] T061 [US7] E2E in `e2e/offline.spec.ts` against `pnpm preview`: go offline, run and finish a workout, go online, expect it in the emulator
- [x] T061a [US7] Offline strip (FR-046) in `src/app/layout/offline-strip.tsx`, rendered by the root layout above every screen; step in `e2e/offline.spec.ts`

---

## Phase 8: User Story 5 — See today's workout from my weekly schedule (P3)

**Independent Test**: quickstart scenario 6, second half.

- [x] T062 [P] [US5] Schedule logic in `src/pages/today/model/schedule.ts` (today's template, next planned, week with done days, home/gym pair swap) with unit tests
- [x] T063 [US5] Full `pages/today` in `src/pages/today/` (`home.html`, `?rest-day`, `?day-sheet`): today's set with exercise list and start, mode switch, week, day sheet to assign or clear, other-workout sheet, last workout
- [x] T064 [P] [US5] E2E in `e2e/today.spec.ts`: assign a set to today, start in two taps, clear the day and see the rest-day state

---

## Phase 9: User Story 6 — Understand my progress (P3)

**Independent Test**: quickstart scenario 7.

- [x] T065 [P] [US6] Statistics selectors in `src/pages/stats/model/` (week muscle load with levels, calendar, per-exercise series for weight, volume and reps, records, body and survey series as weekly averages) with unit tests on seeded workouts
- [x] T066 [P] [US6] Muscle figure in `src/pages/stats/ui/muscle-map/`: port the SVG of `stats.html` to a component with front and back views, load levels from tokens, tap selection
- [x] T067 [US6] Workout history queries in `src/entities/workout/api/history.ts` (date range, cached)
- [x] T068 [US6] `pages/stats` in `src/pages/stats/` (`stats.html`): figure with legend and untrained list, calendar with counts, exercise progress with metric switch and records, body and wellbeing charts on shadcn Charts, empty states
- [x] T069 [P] [US6] E2E in `e2e/stats.spec.ts` with seeded workouts: untrained muscles listed, chart values match
- [x] T087 [US6] Finished workout screen `/workouts/:id` (FR-047, prototype `workout.html`): `src/pages/workout/` with model and component tests, route in `src/app/routes`, stats calendar days link to it (a day with several workouts lists them in a sheet), `e2e/workout.spec.ts`; the link from a done set on «Сегодня» is in `pages/today`

---

## Phase 10: User Story 8 — Hear and feel the workout (P4)

**Independent Test**: quickstart scenario 9.

- [x] T070 [P] [US8] Audio in `src/shared/lib/audio.ts`: lazy `AudioContext`, unlock on the start tap, four distinct generated signals, skip when not running (research R5); unit test with a mocked context
- [x] T071 [US8] Wire signals into the session (end of rest, end of countdown, set done, workout done) honouring the sounds switch; signal a missed end of rest on return
- [x] T072 [US8] Animations: transitions between exercise and rest, sheet and toast motion, hold fill; off when the animations switch is off or `prefers-reduced-motion` is set, in `src/app/styles/motion.css` and the components
- [x] T073 [US8] Remaining settings in `src/pages/settings/`: default rest strip, default weight step, sounds and animations switches; per-exercise weight step control in the rest panel

---

## Phase 11: Polish and cross-cutting

- [x] T074 [P] CI workflow in `.github/workflows/ci.yml`: SHA-pinned `actions/checkout` and `pnpm/setup` with `require-lockfile`, catalog cache keyed on the dataset SHA, `pnpm check`, Playwright with emulators
- [ ] T075 [P] Accessibility pass on every page: focus order, labels, `aria-*` of strips, sheets and switches, contrast of tokens; fix findings
- [x] T076 [P] Responsive pass at 360 px and 1280 px on every route (SC-010) with a Playwright overflow check in `e2e/layout.spec.ts`
- [ ] T077 Run all quickstart scenarios, record results in `specs/001-workout-app/quickstart.md`, update `README.md` with run instructions
- [x] T080 [US5] Several sets per weekday (owner's change, 2026-11-11): `schedule` days become ordered lists of up to 5 `TemplateRef` in the zod schema, converters, defaults, `firestore.rules` and their tests; `src/pages/today/model/schedule.ts` returns today's list with a done flag per set and day states done / partly done; ready-made sets «Разминка» and «Спина: профилактика» in `public/catalog/templates.json`; prototype `../personal-workout-design/home.html` updated (today's list, day sheet with add, remove, reorder)
- [x] T082 [US5] «Другая тренировка» on `pages/today` (FR-044): a sheet with all own and ready-made sets starts the chosen one for today without changing the schedule; component test in `src/pages/today/ui/today-page.test.tsx`, e2e step in `e2e/today.spec.ts`
- [x] T083 [US5] Hold-to-start on `pages/today` (FR-045): every start action, including the «Другая тренировка» sheet, uses the shared `HoldButton`; component test for a short tap and a one-second hold, e2e touch-hold step in `e2e/today.spec.ts`
- [ ] T081 After the first deploy, measure the cold start of the installed app on the owner's phone; only if it is slow, take Firestore off the auth path (split `src/shared/api/firebase.ts` into app+auth and Firestore, auth entry without `firebase/firestore`; pwa agent's proposal of 2026-11-11: JS before the auth gate drops from about 1.1 MB to about 560 kB)
- [ ] T079 Restore `fsd/insignificant-slice` to `error` in `steiger.config.ts`; move any slice still used by a single page into that page
- [x] T078 Deploy jobs in `.github/workflows/ci.yml` (research R7, decided 2026-11-11; deploy only after CI, owner 2026-11-11): on push to `main` after `check`, `build-prod` builds `dist/` from the `VITE_FIREBASE_*` repository variables without secrets; `deploy` installs only the pinned `firebase-tools` and runs `firebase deploy --only firestore:rules,hosting --project personal-workout-1b06f` with the `FIREBASE_SERVICE_ACCOUNT_PERSONAL_WORKOUT_1B06F` secret; SHA-pinned actions, `contents: read`, no cancel on `main`
- [ ] T086 Accessibility fixes from the T075 audit: return focus to the opener when a sheet closes (`shared/ui/sheet`); a visible focus ring and larger targets (or an equivalent list) on the muscle map; distinct names for the survey's «Пропустить»/«Вернуть» buttons; a 44 px «На главную» link on the 404 page; `--border` contrast for non-text UI (1.4.11, owner's decision, it changes the prototypes)
- [x] T084 Flaky e2e: in `e2e/offline.spec.ts` «starts offline and syncs a change made offline», `dumbbells.check()` once left the checkbox unchanged: the box follows the profile cache a tick after the click, so the step now uses `click()` and keeps `toBeChecked()`
- [x] T085 [US1] Hold-to-confirm on «Подход сделан» and «Следующий подход» (FR-027, owner's decision 2026-11-11): `HoldButton` in `src/pages/session/ui/`, touch hold steps in `e2e/session.spec.ts`

---

## Dependencies and execution order

- Phase 1 → Phase 2 → Phase 3 (US2) → Phase 4 (US1, MVP).
- After Phase 4, the stories are independent and can run in parallel: US3, US4, US7, US5, US6, US8.
  US5 extends the minimal `pages/today` of T045; US8 extends the settings page of T051.
- Phase 11 runs last; T074 can start after Phase 1.

Within Phase 4: T031–T033 and T036–T039 are parallel; T034 needs T031–T032; T035 needs T033–T034;
T040–T046 need T034–T039; T047–T048 last.

## Parallel work for Opus agents

| Wave | Agents (one per line) |
|---|---|
| Setup | after T001–T003: T004 · T005 · T006 · T007 · T008 · T010 · T012 |
| Foundation | after T014: T015 · T016+T017 · T018 · T019+T020 · T021 · T022 · T023 |
| US1 logic | T031 · T032 · T033 · T036 · T037 · T038 · T039 |
| After MVP | US3 (T049–T052) · US4 (T053–T057) · US7 (T058–T061) · US5 (T062–T064) · US6 (T065–T069) · US8 (T070–T073) |

Files shared between waves (`vite.config.ts`, `package.json`, `src/app/routes/`, `src/pages/settings/`,
`src/pages/today/`) are edited by one agent at a time.

## Implementation strategy

1. Phases 1–2, then the owner reviews the scaffold and tooling.
2. Phase 3 with the device check of sign-in (T030).
3. Phase 4 = MVP: stop, the owner tries a real workout on the phone.
4. Remaining stories in parallel, each reviewed on its own.
5. Phase 11, then deploy with T078 (research R7).
