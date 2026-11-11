# Personal Workout — requirements

Status: agreed with the owner on 2026-11-11. The specification is `specs/001-workout-app/spec.md`.

## Process

- Stages are agreed one by one: requirements → design prototypes → spec → plan → tasks → implementation.
- The owner makes every key technical decision (libraries, build tool, data model, state management, testing).

## Stack and tooling

- React, Feature-Sliced Design architecture.
- Vite + React + TypeScript, React Router, TanStack Query for Firestore data, Zustand for the running session, shadcn Charts (Recharts) for statistics.
- shadcn/ui on Radix UI primitives (with its CLI and agent skills) and Tailwind CSS.
- The muscle figure in statistics is our own SVG from the approved prototype (`stats.html`), not a library.
- One dark theme; all colours are design tokens so that themes can be added later.
- Node 24 LTS (24.22.2), pinned in the repository. Node 26 was the first choice, but firebase-tools' dependency superstatic 10 does not admit it and the engine check stays strict.
- pnpm 12.17.0 as the package manager, configured against supply-chain attacks from the first commit: pinned pnpm and Node versions, committed lockfile and frozen installs, dependency install scripts blocked unless allow-listed, minimum release age of 7 days in strict mode, no trust downgrade, exact versions, `pnpm audit` and signature audit in CI. Exact keys are taken from the pnpm 12 docs at the plan stage.
- Owner's decisions on install refusals (2026-11-11): install scripts of `@firebase/util` and `protobufjs` are denied explicitly; `lefthook` is pinned to 2.2.1 (the newest version published with provenance) and its install script is allowed; trust-policy exceptions exist only as exact versions: `chokidar@4.0.3` (needed by steiger and firebase-tools) and `@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1` (needed by vite-plugin-pwa through workbox-build); TypeScript is pinned to 6.0.3 until typescript-eslint supports 7; packages added by the shadcn CLI (`cn`, `shadcn`, `radix-ui`) are approved; system font stack, no font package; the install script of `re2` (optional native dependency of firebase-tools) is allowed.
- The dependency list approved by the owner on 2026-11-11 is in `docs/research/tooling-2026-11-11.md` and the plan; any package beyond it needs a separate approval.
- Agent skills approved for the project: shadcn, Firebase, React Router, Feature-Sliced Design, commitlint, Playwright CLI. No MCP servers for now.
- For every technology used, look for an official CLI and agent skills and agree them with the owner.
- Firebase on the free Spark plan: Hosting, Auth, Firestore. No Cloud Functions, no Cloud Storage.
- Development and tests run against the local Firebase emulator (Auth, Firestore); the real project is created by the owner before the first deploy.
- Deploy to Firebase Hosting by GitHub Actions on push to `main`, after the checks pass.
- GitHub Spec Kit for spec → plan → tasks.
- ESLint + Prettier, Steiger for FSD boundaries, Lefthook + commitlint (Conventional Commits).
- Tests: Vitest for logic, Firestore rules tests on the emulator, Testing Library for key session scenarios, Playwright end-to-end in mobile and desktop viewports.
- Works on desktop and phone.
- Installable PWA; a workout runs offline and syncs later. Exercise photos are cached as they are viewed.

## Data

- Each user's data and settings live in Firestore under that user.
- Exercise catalog and photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (800+ exercises, 2 photos each, Unlicense), shipped as static hosting assets.
- Interface in Russian. The exercise catalog (names, muscles, equipment, instructions) stays in English for now; its translation is in the backlog.

## Exercises

- Types: strength (sets × reps × weight), bodyweight (optional added weight), timed, cardio.
- Every exercise has a visualization (photos from the catalog).
- Equipment profile in settings: the user marks what they have at home. "Home" mode offers only exercises that fit the profile; the rest are marked "gym". Built on the catalog's `equipment` field.

## Workout templates

- Ready-made templates and user-created templates.
- Ready-made sets: home without equipment, home with dumbbells and pull-up bar, gym full body and splits, stretching and cardio, warm-up, back prevention.
- A template is an ordered list of exercises, each with planned sets, reps or duration, and rest between sets. Weight is prefilled from the previous workout.
- Weekly schedule: one or several templates per weekday, in order (for example warm-up, back exercises for prevention, stretching); the app shows today's workouts. Each template of the day is started on its own, is marked done on its own and is saved as a separate workout (owner's decision, 2026-11-11).

## Workout session

- Full-screen card of the current exercise.
- Skip postpones the exercise (for example, the machine is busy) and moves to the next one. Postponed exercises are listed on the session screen ("Postponed: N") and can be resumed at any moment from the set where they stopped. After the last exercise the app offers to do the postponed ones or to finish without them; those left undone are saved as skipped.
- Go back returns to the previous set or exercise to redo it or correct its logged result.
- Quick add: search the catalog, then choose "do now", "next" or "replace current".
- The screen stays on for the whole workout session, including rest.
- Timers: total workout time, current exercise time, rest countdown between sets, countdown for timed exercises.
- Logging must not interrupt the workout: during the rest countdown the same screen shows quick buttons for the reps and weight of the set just done, prefilled with the previous result. Leaving them untouched is valid.
- Quick buttons are a horizontally scrollable strip of values centred on the previous result; a tap selects a value, and tapping the selected value opens exact numeric input. The weight step is set per exercise (2.5 kg by default).
- Every set is logged with its own reps and weight; records, volume and muscle load are derived from the sets and not stored as separate input.
- Logged values are remembered per exercise and per set number, because the weight differs between the first and the last sets. The pickers for set N are prefilled with a prediction from the workout history for set N. If the user picks a different weight in a set, the predictions for the remaining sets shift by the same difference.
- The exercise card has a button that opens the exercise description: technique steps, muscles, equipment. Timers keep running.
- Back, skip and finish workout fire only after the button is held for one second on touch devices, to avoid accidental taps. With a mouse or keyboard a plain click is enough.
- Sounds and animations: sound signals for session events (rest over, countdown finished, set and workout completed) and animated transitions and feedback in the interface. Sounds can be turned off in settings.
- End of workout: wellbeing and energy on a 1–5 button scale, body weight as the previous value with ±0.1/±0.5 kg buttons. Every item can be skipped.

## Statistics (v1)

- Per-exercise progress: weight, reps, volume over time, personal records.
- Regularity: calendar, workouts per week and month, total time.
- Body weight, wellbeing and energy over time.
- Load by muscle group for the current week (Monday to today), shown as a human figure from all sides with muscles coloured by load, so untrained muscles stand out.

## Backlog (not in v1)

- Sharing templates between users: by link and/or a public catalog. Decide the mechanism when it is picked up.
- Family: create a family and follow a partner's progress.
- Russian translation of the exercise catalog.
- Custom exercises created by the user.
- Deleting the account and its data from the app.
- Reminders and notifications outside the open app.
- Workout streak: consecutive workouts without a missed scheduled day.

## Open questions

- None. All screens of the design were approved by the owner on 2026-11-11: HTML prototypes (mobile and desktop) are in `../personal-workout-design/`, `index.html` lists them.
