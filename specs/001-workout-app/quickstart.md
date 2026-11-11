# Quickstart: run and validate

## Prerequisites

- Node 24 (`nvm use` reads `.nvmrc`) and pnpm; pnpm 12.17.0 is downloaded from the pin in `package.json`.
- Java 21 runtime for the Firebase emulators (`openjdk-21-jre-headless`).
- No Firebase project is needed locally: everything runs against the emulators under the demo
  project id `demo-workout`.

## Run

```sh
pnpm install --frozen-lockfile
pnpm catalog            # fetch the pinned dataset, verify checksums, build public/catalog
pnpm dev                # Auth and Firestore emulators (UI on :4000) + Vite on 127.0.0.1:5173
```

Open http://127.0.0.1:5173 and press «Войти через Google»: the Auth emulator opens its own sign-in
page in a popup, where any test account can be added. `DEV_HOST=<tailscale-ip> pnpm dev:remote`
serves the same on a Tailscale address for a phone (see README.md).

## Checks

| Command | What it proves |
|---|---|
| `pnpm lint` | ESLint, Prettier check, Steiger (FSD boundaries), no colour literals outside `tokens.css` |
| `pnpm typecheck` | TypeScript strict |
| `pnpm test` | unit and component tests (prediction, statistics, timers, session scenarios) |
| `pnpm test:rules` | Firestore rules contract ([contracts/firestore-access.md](./contracts/firestore-access.md)) on the emulator |
| `pnpm e2e` | Playwright, mobile 390×844 and desktop 1280×800, against the emulators; skips `e2e/offline.spec.ts` |
| `pnpm e2e:offline` | the offline scenario against a production build of mode `e2e` (`dist-e2e/`, emulators, demo project) |
| `pnpm check` | catalog, typecheck, test, build, lint, rules, e2e with the offline project, `pnpm audit` and `pnpm audit signatures` |
| `pnpm build && pnpm preview` | production build with the service worker |

`TEST_PORT_OFFSET=<n> pnpm test:rules` (or `pnpm e2e`, `pnpm e2e:offline`) moves every emulator, Vite
and preview port by `n`, so several runs can go side by side; the default ports belong to `pnpm dev`.

## Validation scenarios

Each maps to a user story of [spec.md](./spec.md); screens are compared with the prototypes listed
in [contracts/routes.md](./contracts/routes.md).

1. **Workout (US1)**: start a ready-made set from the today screen («Другая тренировка» on a rest day); log two exercises, changing one weight and leaving
   the rest untouched; postpone one exercise and resume it from the postponed list; add an exercise
   "next"; finish; answer the survey. Expect every set, the postponed exercise and the survey in
   the saved workout.
2. **Resume (US1, SC-005)**: during a rest, reload the page and reopen the app. Expect the same set
   and a rest countdown consistent with real time.
3. **Hold buttons (SC-006)**: in the mobile viewport a short tap on back, skip and finish does
   nothing; a one-second hold fires. In the desktop viewport a click fires. The same holds for
   «Начать» on the sets screen.
4. **Isolation (US2, SC-009)**: `pnpm test:rules` passes; in the app a second account sees none of
   the first account's data.
5. **Home and gym (US3)**: in the profile mark «Гантели» and «Турник», turn on «Только для дома» in the catalog. Expect no
   exercise that needs other equipment, and "gym" marks when the switch is off.
6. **Sets and schedule (US4, US5)**: copy a ready-made set, edit and save it, add it to today in the
   day sheet (tap today in the week; up to 5 sets per day, in order), start it from the today screen
   in two taps.
7. **Statistics (US6)**: with seeded workouts, the figure shows untrained muscle groups as
   untrained and lists them; charts match the seeded data.
8. **Offline (US7)**: in the production preview, go offline, run and finish a workout, go online.
   Expect the workout in Firestore.
9. **Sounds and motion (US8)**: signals play at the end of rest with sounds on and not with sounds
   off; with reduced motion transitions are instant.

## Results (2026-11-11, `TEST_PORT_OFFSET=400`, mobile 390×844 and desktop 1280×800)

| # | Result | Evidence |
|---|---|---|
| 1 | pass | `e2e/session.spec.ts` «a workout keeps every set…» |
| 2 | pass | `e2e/session.spec.ts` «a reload during rest…» |
| 3 | pass | `e2e/session.spec.ts` «back, skip and finish need a hold…», `e2e/templates.spec.ts` «start needs a hold on touch» |
| 4 | pass | `pnpm test:rules` (43 tests), `e2e/auth.spec.ts` «a second account sees none…» |
| 5 | pass | `e2e/catalog.spec.ts` |
| 6 | pass | `e2e/templates.spec.ts`, `e2e/today.spec.ts`; a manual walk that reloaded right after saving an edited set once showed the old name: not reproduced by the specs, open |
| 7 | pass | `e2e/stats.spec.ts` |
| 8 | fail | `e2e/offline.spec.ts:46`: `check()` on «Гантели» reports «did not change its state» (the box follows the profile cache a tick later; `e2e/catalog.spec.ts` uses click + `toBeChecked`) |
| 9 | not built | sounds and animations are T070–T072; the settings page has the two switches only |
