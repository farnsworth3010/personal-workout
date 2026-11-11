# Report p2 — api (T014, T015, T016, T017)

## Package
`pnpm add zod` → **zod 4.6.7** (exact, passed the 7-day/trust policy). Diff: one line in
`package.json` dependencies, 3 lines in `pnpm-lock.yaml`. Nothing else touched.

## Files created
- `src/shared/api/env.d.ts` — typed `ImportMetaEnv` for the VITE_FIREBASE_* keys (strictTypeChecked
  otherwise flags `any` from `import.meta.env`).
- `src/shared/api/firebase.ts` (+ `firebase.test.ts` node, `firebase.dom.test.tsx` jsdom)
- `src/shared/api/schema/{documents,converter,refs,index}.ts` (+ `documents.test.ts`, `converter.test.ts`)
- `src/shared/api/query.ts` (+ `query.test.ts`, `query.hook.test.tsx`)
- `src/shared/api/write.ts` (+ `write.test.ts`)
- `src/shared/api/index.ts` — public API
- `src/app/layout/query-provider.tsx`

## Public API (`@/shared/api`)
Firebase:
- `app: FirebaseApp`, `auth: Auth` (getAuth), `db: Firestore` (initializeFirestore with
  `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`, `memoryLocalCache()` when
  `indexedDB` is undefined (node/jsdom); `ignoreUndefinedProperties: true`). Emulators connected when
  `import.meta.env.DEV || MODE === 'test'`.

Schemas (zod 4) and types (`z.infer`):
- `muscleSchema`/`Muscle` (17), `equipmentSchema`/`Equipment` (12 dataset values + `pull-up bar`),
  `exerciseKindSchema`/`ExerciseKind`, `templateRefSchema`/`TemplateRef`
- `profileSchema`/`Profile`, `templateEntrySchema`/`TemplateEntry`, `templateSchema`/`Template`,
  `loggedSetSchema`/`LoggedSet`, `workoutEntrySchema`/`WorkoutEntry`, `workoutSchema`/`Workout`,
  `exerciseStatsSchema`/`ExerciseStats`
- `zodConverter<S extends z.ZodObject>(schema): FirestoreDataConverter<z.output<S>>` — parses on
  read and on write; with SetOptions (merge) parses `schema.partial()`.
- `profileConverter`, `templateConverter`, `workoutConverter`, `exerciseStatsConverter`
- Refs: `profileRef(uid)`, `templatesRef(uid)`, `templateRef(uid, id)`, `workoutsRef(uid)`,
  `workoutRef(uid, id)`, `exerciseStatsRef(uid)`, `exerciseStatRef(uid, exerciseId)` — all with converters.
  New client id: `doc(templatesRef(uid))`.

Query:
- `createQueryClient(): QueryClient` — queries `{ networkMode: 'always', staleTime: Infinity, retry: false, refetchOnWindowFocus: false }`, mutations `{ networkMode: 'always', retry: false }`.
- `type SnapshotSource<T> = (next: (data: T) => void, error: (e: unknown) => void) => Unsubscribe`
- `subscribeQuery<T>(client, queryKey, source): Unsubscribe` — `setQueryData` on each snapshot;
  on error sets the query to `status: 'error'`; ref-counted: one listener per key per client, the
  last unsubscribe closes it.
- `useSnapshotQuery<T>(queryKey, source): UseQueryResult<T>` — effect subscribes (re-subscribes only
  when the key hash changes) + `useQuery({ queryKey, queryFn: skipToken })`; `pending` until the
  first snapshot.
- `docSource<T>(ref): SnapshotSource<T | null>`, `querySource<T>(query): SnapshotSource<WithId<T>[]>`
  — onSnapshot adapters; a converter that rejects a document goes to `error` instead of throwing
  inside the Firestore listener. `type WithId<T> = T & { id: string }`.
  Usage: `useSnapshotQuery(['profile', uid], docSource(profileRef(uid)))`.

Write:
- `fireWrite(write: () => Promise<unknown>): void` — starts the write, never returns/awaits the
  promise; rejections and synchronous throws (e.g. converter validation inside `setDoc`) go to the
  channel. Usage: `fireWrite(() => setDoc(workoutRef(uid, id), workout))`.
- `onWriteError(listener: (error: unknown) => void): () => void`; with no listener the error is
  `console.error`ed so it is never lost silently.

App: `QueryProvider({ children })` in `src/app/layout/query-provider.tsx` (client in `useState`).

## Verification
- `pnpm exec vitest run src/shared/api`: 7 files, 92 tests passed (unit + ui projects).
- `pnpm exec eslint src/shared/api src/app/layout/query-provider.tsx`: clean.
- `pnpm exec prettier --check` same paths: clean.
- `pnpm typecheck`: clean (an earlier error in another agent's `src/shared/ui/page-header.tsx`,
  unused `cn`, was gone on the last run).
- `pnpm exec steiger ./src`: no findings for shared/api or app/layout; 2 `insignificant-slice`
  warnings for `entities/exercise` and `entities/template` (other agents, expected until Phase 11).

## Lines for shared files
- `.env.example` (all optional; defaults run against the emulators with project `demo-workout`):
  ```
  VITE_FIREBASE_API_KEY=
  VITE_FIREBASE_AUTH_DOMAIN=
  VITE_FIREBASE_PROJECT_ID=
  VITE_FIREBASE_APP_ID=
  # host:port, used only in dev and test
  VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
  VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
  ```
  Defaults: apiKey `demo-api-key`, authDomain `<projectId>.firebaseapp.com`, appId unset.
- `src/app/index.tsx`: wrap the tree in `<QueryProvider>` (`import { QueryProvider } from './layout/query-provider'`).
- For the `entities/exercise` agent (T021): take `Muscle`, `Equipment`, `ExerciseKind` (and the zod
  enums) from `@/shared/api` instead of redefining them, so the catalog and Firestore share one list.

## Decisions the owner may want to revisit (limits not given in data-model.md)
1. `profile.defaultRestSec`: int 0–900 (same as an entry's `restSec`).
2. Template entry and workout `plan`: **exactly one** of `reps` / `durationSec` (data-model says reps
   for strength/bodyweight, duration for timed/cardio; kind isn't stored on a template entry).
3. `workout.summary` is `null` while active (data-model: "written at finish"); `survey` is always an
   object, `{}` allowed.
4. `summary.muscleSets` is a partial record (only trained muscles), not all 17 keys.
5. Logged sets: `n` 1–20, `reps` 0–200 (0 = failed attempt), `durationSec` 0–7200 (stopped early),
   `weightKg` ≥ 0 with no upper cap; ≤ 20 logged sets per entry; `lastSets` ≤ 20.
6. `exerciseStats.weightStepKg`: any positive number or null; `bodyWeightKg` > 0; records ≥ 0.
7. All document objects are strict (unknown keys rejected on read and write), mirroring the rules'
   key allow-list.
8. Workout `template.name` reuses the template name limit 1–60; entry `name` only non-empty.
9. Emulator banner disabled (`connectAuthEmulator(..., { disableWarnings: true })`).
10. `ignoreUndefinedProperties: true` so optional keys left `undefined` don't make writes throw.

## Open problems
- Merge writes validate top-level keys only and reject FieldValue sentinels (`deleteField`,
  `arrayUnion`); nested objects (e.g. `schedule`) must be passed whole. `updateDoc` bypasses
  converters entirely, so profile updates (T022) should use `setDoc` with the whole document or a
  merge with complete top-level fields. Marked `shortcut:` in `converter.ts`.
- Emulators connect only in DEV/test. T061 runs e2e against `pnpm preview` (production build) and
  expects data in the emulator — that will need a switch (e.g. `VITE_FIREBASE_USE_EMULATORS`) later.
- Timestamp round-trip is unit-tested through the converter with a fake snapshot; a real emulator
  round trip is not covered here (rules tests / e2e will exercise it).
- `pnpm build` was not run (nothing imports `shared/api` from the app entry yet; zod adds to the bundle).

# Report P2: catalog (T019, T020, T021)

## Files created

| File | Purpose |
|---|---|
| `scripts/fetch-catalog.ts` | T019: git init / `fetch --depth 1 <sha>` / `checkout --force` / `clean -ffdx` into `.catalog-cache/`, verify against the manifest; `--write-manifest` regenerates it |
| `scripts/catalog-manifest.sha256` | committed manifest, 2,623 lines (876 JSON + 1,746 JPEG + `dist/exercises.json`), sha256sum format, sorted; `sha256sum -c` inside the cache passes |
| `scripts/lib/manifest.ts` (+ `.test.ts`) | hash the cache, format/parse/diff the manifest, `verifyCache()` (used by fetch and build) |
| `scripts/build-catalog.ts` | T020: re-verifies the cache, applies overrides, writes `public/catalog/exercises.json`, copies photos to `public/catalog/images/<id>/<n>.jpg` |
| `scripts/lib/derive.ts` (+ `.test.ts`) | pure `deriveKind(category, equipment)` and `toExercise(raw, override?)` |
| `scripts/catalog-overrides.json` | 38 overrides, each with a `reason` (listed below) |
| `scripts/catalog.test.ts` | labels completeness and kind set against the built `public/catalog/exercises.json` |
| `src/entities/exercise/model/types.ts` | `Exercise`, `ExerciseKind`, `Muscle` (17), `Equipment` (12 dataset values + `pull-up bar`) |
| `src/entities/exercise/config/labels.ts` | `muscleLabels`, `equipmentLabels` (Russian) |
| `src/entities/exercise/lib/exercise.ts` (+ `.test.ts`) | `isGymOnly`, `photoUrl` |
| `src/entities/exercise/api/catalog.ts` | catalog query, lookup by id |
| `src/entities/exercise/index.ts` | public API |

## Public API of `entities/exercise`

```ts
export const catalogQuery // queryOptions: key ['catalog', 'exercises'], fetch('/catalog/exercises.json'), staleTime: Infinity
export function useCatalog(): UseQueryResult<Exercise[]>
export function useExercise(id: string): UseQueryResult<Exercise | undefined> // select over the same query
export function findExercise(catalog: readonly Exercise[], id: string): Exercise | undefined
export function isGymOnly(exercise: Exercise, homeEquipment: readonly Equipment[]): boolean
export function photoUrl(exercise: Exercise, n: number): string | undefined // '/catalog/images/<id>/<n>.jpg'
export const muscleLabels: Record<Muscle, string>
export const equipmentLabels: Record<Equipment, string>
export type { Equipment, Exercise, ExerciseKind, Muscle }
```

No `@x` file yet: nobody imports the entity from another entity in this wave. Workout and session
will need `entities/exercise/@x/workout.ts` re-exporting the types (plan.md).

## Shared type between script and entity (decision)

The single definition lives in `src/entities/exercise/model/types.ts`, which has no imports. Scripts
import it by relative path with `import type` (`scripts/lib/derive.ts`), which Node type stripping
erases, so no runtime coupling. `scripts/catalog.test.ts` imports `config/labels.ts` as a value in
the test only. FSD is not broken: `scripts/` is outside `src`, Steiger does not see it, and nothing
in `src` depends on `scripts`. The reverse (type in `scripts/`, imported by the entity) would make
the app depend on a build folder. tsconfig.node.json already includes `scripts`, and the imported
entity files type-check under it (no DOM or Vite types in them).

## Output

- 876 exercises; kinds: strength 628, timed 131, bodyweight 103, cardio 14.
- `public/catalog/exercises.json`: 814,936 bytes (156,382 gzip -9), compact JSON.
- `public/catalog/images/`: 1,746 JPEG, 101 MB. Three exercises have no photos in the dataset
  (`Kettlebell_Halo`, `Kettlebell_Halo_With_Overhead_Extension`, `Kettlebell_Overhead_Triceps_Extension`);
  their `images` is `[]`, and `photoUrl` returns `undefined`.
- Run time: cold (no cache, fetch + build) 33.0 s wall, almost all network; warm (cache verified,
  network skipped, images re-copied) 1.3 s. `--write-manifest` on a present cache: 0.55 s.

## Overrides (scripts/catalog-overrides.json)

Kind derivation (R11) runs on the equipment after the override, and treats `pull-up bar` like
`body only` (→ bodyweight); an explicit `kind` wins.

| Id | Override | Reason |
|---|---|---|
| Chin-Up, Pullups, V-Bar_Pullup, Wide-Grip_Rear_Pull-Up | equipment `pull-up bar` | pull-up bar exercise labelled body only |
| Gorilla_Chin_Crunch, Hanging_Leg_Raise, Hanging_Pike, Wind_Sprints | equipment `pull-up bar` | hangs from a bar, labelled body only (Wind_Sprints is hanging alternate knee raises) |
| Mixed_Grip_Chin, Side_To_Side_Chins, Gironda_Sternum_Chins, One_Arm_Chin-Up, Rocky_Pull-Ups_Pulldowns | equipment `pull-up bar` (→ bodyweight) | pull-up bar exercise labelled `other` |
| Band_Assisted_Pull-Up | equipment `pull-up bar` (→ bodyweight) | pull-up bar with a band, labelled `other` |
| Scapular_Pull-Up | equipment `pull-up bar` (→ bodyweight) | pull-up bar exercise, equipment null |
| Weighted_Pull_Ups | equipment `pull-up bar`, kind `strength` | logged with added weight |
| One_Handed_Hang | equipment `pull-up bar` | hangs from a chin-up bar, labelled `other`; stays timed (stretching) |
| Plank, Side_Bridge | kind `timed` | static hold |
| Isometric_Neck_Exercise_-_Front_And_Back, Isometric_Neck_Exercise_-_Sides, Isometric_Chest_Squeezes | kind `timed` | isometric hold |
| Crucifix | kind `timed` | weights held out to the side for time |
| Plate_Pinch | kind `timed` | grip hold for as long as possible |
| Downward_Facing_Balance | kind `timed` | balance hold on an exercise ball |
| Alternate_Leg_Diagonal_Bound, Bodyweight_Walking_Lunge, Carioca_Quick_Step, Decline_Push-Up, Floor_Glute-Ham_Raise, Kneeling_Arm_Drill, Linear_3-Part_Start_Technique, Linear_Acceleration_Wall_Drill, Mountain_Climbers, Moving_Claw_Series, Side_Standing_Long_Jump | equipment `body only` (→ bodyweight) | equipment null in the dataset, so R11 made them `strength` |
| Prone_Manual_Hamstring | kind `bodyweight` | partner gives the resistance, no weight to log |
| Inverted_Row | equipment `other`, kind `bodyweight` | body weight row under a bar in a rack or Smith machine (dataset: null) |

How the list was built: every `force: static` exercise outside `stretching`; names matching
plank/hold/hang/bridge/isometric/pull-up/chin; instructions mentioning a pull-up, chin-up or
overhead bar; every `equipment: null` exercise outside `stretching`. Left as is on purpose:
`Muscle_Up`, `Kipping_Muscle_Up` (rings, `other`), dips on parallel bars (`other`), glute bridges
and `Isometric_Wipers` (done for reps), hang cleans/snatches (barbell).

The build fails on an override whose id is not in the dataset, and on an id that is not
`[\w-]+` (ids become directory names).

## Verification

```
$ pnpm exec eslint scripts src/entities/exercise          → no output, exit 0
$ pnpm exec prettier --check scripts src/entities/exercise → All matched files use Prettier code style!
$ pnpm exec vitest run scripts src/entities/exercise       → Test Files 4 passed (4), Tests 15 passed (15)
$ pnpm typecheck                                          → tsc -b, exit 0
$ pnpm exec steiger ./src                                 → 2 warnings, fsd/insignificant-slice for
  src/entities/exercise and src/entities/template (no consumers yet; a warning by the owner's
  phase 2–10 decision)
$ (cd .catalog-cache && sha256sum -c --quiet ../scripts/catalog-manifest.sha256) → ok
```

Tamper checks: appending to `exercises/Plank.json`, deleting `exercises/Pullups/0.jpg` and adding
`exercises/extra.txt` → `build-catalog` exits 1 listing `mismatch` / `missing` / `extra`;
`fetch-catalog` re-fetches, restores and exits 0. Editing the manifest (one hash changed, one line
removed) → `fetch-catalog` re-fetches, then exits 1 with `mismatch exercises/3_4_Sit-Up.json` and
`extra exercises/90_90_Hamstring.json`. Restored manifest → "network skipped", exit 0.

## Lines for shared files

`package.json` scripts:

```json
"catalog": "node scripts/fetch-catalog.ts && node scripts/build-catalog.ts",
```

Suggested (owner's call): run `pnpm catalog` at the start of `check` and before `build` in CI
(e.g. `"check": "pnpm catalog && pnpm typecheck && ..."`); otherwise `vite build` ships no catalog
and `scripts/catalog.test.ts` is skipped.

`.gitignore`: nothing; `public/catalog/exercises.json`, `public/catalog/images` and
`.catalog-cache` are already ignored (`git check-ignore` confirms).

## Decisions the owner may want to revisit

1. `equipment: null` counts as available everywhere in `isGymOnly` (62 of the 77 are stretches; the
   rest are fixed by overrides above).
2. `pull-up bar` was also given to bar exercises the dataset labels `other` or null, not only
   `body only`, so a home user with a pull-up bar sees chin-up variants as home exercises.
3. `deriveKind` treats `pull-up bar` as body weight (an extension of R11's `body only` rule).
4. `scripts/catalog.test.ts` is skipped when the catalog is not built (it is generated, not
   committed). If CI should always enforce it, run `pnpm catalog` before tests.
5. `catalogQuery` sets only `staleTime: Infinity`; `gcTime` stays at the QueryClient default, so with
   no observers for that long the JSON is fetched again (from the service worker cache once the PWA
   exists). Setting `gcTime: Infinity` is one line if wanted.
6. Russian labels: e.g. `cable` = «Блочный тренажёр», `machine` = «Тренажёр», `other` = «Другое»,
   `hamstrings` = «Задняя поверхность бедра». Worth a look against the prototypes' wording.

## Open problems

- **Type duplication risk with T015.** `shared/api/schema` (profile `homeEquipment: Equipment[]`,
  workout `kind`, `summary.muscleSets: Record<Muscle, number>`) needs `Equipment`, `Muscle` and
  `ExerciseKind`, but `shared` cannot import `entities`. If T015 defines its own unions, there will be
  two definitions. Options: move the three unions into `shared` (e.g. `shared/api/schema`) and have
  `entities/exercise/model/types.ts` re-export them (scripts would import from shared then), or keep
  them here and type the Firestore fields as `string`. Needs a decision by the integrator/owner.
- `public/catalog/templates.json` exists in the working tree (not mine; untouched).

# Report p2 / ui — T018 shared UI primitives

## Files created (all unstaged, in `src/shared/ui/`)

| File | What |
| --- | --- |
| `sheet.tsx` | shadcn `sheet` adapted: radix-ui Dialog, bottom sheet < 900px, centred 520px dialog ≥ 900px |
| `toast.tsx` | hand-built toast store + `<Toaster />` (sonner not installed) |
| `chip.tsx` | radix-ui `Toggle` styled as the prototype chips |
| `chip-row.tsx` | horizontal scroller: hidden scrollbar, mask fade, wheel → horizontal |
| `switch.tsx` | shadcn `switch` restyled to settings.html (52×32, thumb 24) |
| `stat-row.tsx` | `StatRow` + `Stat`, the "Подход / План / Время" row of card.html |
| `badge.tsx` | shadcn `badge` reduced to the one "зал" style (`bg-warn text-on-accent`) |
| `page-header.tsx` | uppercase 800 title (26px / 40px ≥ 900) + muted subtitle |
| `empty-state.tsx` | exercises.html `.empty` block |
| `demo.tsx` | `UiDemo` with every primitive in a few states |
| `*.test.tsx` | sheet, toast, chip, chip-row, switch (10 tests) |
| `index.ts` | updated exports |

Nothing added under `src/shared/lib/`. No package changes. shadcn sources came from
`shadcn add dialog sheet switch badge drawer sonner` run in a throwaway copy
(`<session scratch>/shadcn-copy`); the CLI added `vaul`, `sonner`, `next-themes` to that copy's
package.json only. **Drawer (vaul) and Sonner were not used**: sheet is on radix-ui Dialog, toast is
~40 lines by hand.

## Public API (`@/shared/ui`)

```ts
Sheet(props: Dialog.Root props)                 // open / onOpenChange / defaultOpen
SheetTrigger(props: Dialog.Trigger props)
SheetClose(props: Dialog.Close props)
SheetContent(props: Dialog.Content props & {
  title: ReactNode            // rendered as Dialog.Title (h2 style of the prototypes)
  description?: ReactNode     // Dialog.Description, muted line under the title
  dismissible?: boolean       // default true; false: Escape and backdrop do nothing, no × button
})
toast(text: string): void     // works outside React; replaces the current one; hides after 2 s
Toaster()                     // mount once
Chip(props: Toggle.Root props)        // pressed / defaultPressed / onPressedChange, aria-pressed
ChipRow(props: div props & { fade?: 'end' | 'both' })  // 'end' = exercises filters, 'both' = value pickers
Switch(props: Switch.Root props)      // checked / onCheckedChange, role="switch"
StatRow(props: div props); Stat(props: div props & { label: ReactNode; value: ReactNode })  // children render under the value (set dots)
Badge(props: span props)
PageHeader(props: header props & { title: ReactNode; subtitle?: ReactNode })
EmptyState(props: div props & { title: ReactNode; description?: ReactNode })  // children = action
UiDemo(props: { sheetOpen?: boolean })
Button, buttonVariants        // unchanged
```

Behaviour notes:
- Sheet focuses itself on open (as the prototypes do, so × gets no ring after a tap); Radix keeps the
  focus trap, scroll lock and focus return. Overlay is `bg-scrim`.
- Toast position: `bottom: 24px + safe area`; when the page contains an element with
  `[data-app-nav]` it moves to `72px + safe area` on phones and to `bottom 24px, left 50% + 110px`
  from 900px (prototype values), via `body:has([data-app-nav])`. No wiring needed beyond the attribute.
- ChipRow wheel: a vertical wheel turn scrolls sideways (non-passive native listener,
  `preventDefault`), a horizontal swipe is left to the browser; scroll-snap pauses for 150 ms while
  the wheel turns. Masks are set as inline `maskImage` + `WebkitMaskImage` so the build cannot drop
  the prefixed one. Snap and the 5-per-row value chips are the consumer's classes (see demo).

## Lines for shared files (integrator)

- `src/app/…` layout (T016/T024): mount the toaster once, e.g. in the root layout:
  `import { Toaster } from '@/shared/ui'` … `<Toaster />`
- `src/widgets/app-nav` (T024): put `data-app-nav` on the nav root element, e.g.
  `<nav data-app-nav …>`, so toasts sit above the bottom bar / beside the sidebar.

## Verification

```
pnpm exec vitest run src/shared      Test Files 14 passed (14), Tests 105 passed (105)
                                      (src/shared/ui alone: 6 files, 11 tests incl. button)
pnpm exec eslint src/shared/ui       clean
pnpm exec prettier --check src/shared/ui   All matched files use Prettier code style!
pnpm typecheck                       clean
pnpm lint:colors                     clean
pnpm exec steiger ./src              2 warnings, not mine: entities/exercise and entities/template
                                      "no references" (insignificant-slice, warn until T079).
                                      An earlier run showed shared/api missing index.ts (another agent, since fixed).
```

Screenshots (Playwright, temporary Vite entry in my scratch dir, nothing in `src/app`):
`shots/p2-ui-m.png` (390×844), `shots/p2-ui-d.png` (1280×800), plus `p2-ui-m-sheet.png`,
`p2-ui-d-sheet.png` with the sheet open. Compared with exercises/settings/card prototypes: chips,
switch, stat row, badge, header, empty state and sheet match sizes, radii and tokens. Fonts fall back
to system sans as in the prototypes (Inter not loaded). Headless `--screenshot` with
`--virtual-time-budget` did not paint the toast's transition on desktop; Playwright does.

## Decisions the owner may want to revisit

1. Chip uses Radix `Toggle` (not on the brief's shadcn list): gives aria-pressed and
   controlled/uncontrolled state for free. The picker's "tap the selected chip to type a value"
   is a consumer concern (controlled `pressed` + `onClick`).
2. StatRow follows card.html: rules above and below the row, no vertical dividers between columns.
3. Badge default is the exercises/template-edit look (11px, uppercase); card.html's photo badge is
   12px, not uppercase — pass classes there.
4. Toast is above an open sheet (`z-60` vs `z-50`); in the prototypes a `<dialog>` top layer would
   cover it. While a modal sheet is open Radix sets `aria-hidden` on everything outside it,
   so a screen reader will not announce that toast.
5. template-edit.html lifts the toast to 140px above its sticky footer; not supported (no prop).
   Add an offset option when that screen is built if needed.
6. `UiDemo` is exported from the public API so a dev route can render it; tree-shaken from builds
   that do not import it.

## Open problems

- `src/shared/ui/sheet.tsx` and `index.ts` show `AM` in `git status`: an early version of them was
  staged by someone else during the wave. I did not stage anything; the working tree holds the
  final versions.

# Report P2: templates (T023)

## Files created

- `public/catalog/templates.json`: 8 ready-made sets, 48 distinct exercise ids
- `src/entities/template/index.ts`: public API
- `src/entities/template/model/types.ts`: `TemplateEntry`, `Template`, `Place`, `ReadyTemplate`, `TemplateRef`
- `src/entities/template/api/ready-templates.ts`: query for `/catalog/templates.json`
- `src/entities/template/api/ready-templates.test.ts`: data test of templates.json
- `src/entities/template/lib/derive.ts`, `lib/derive.test.ts`: derivations and their unit tests
- `src/entities/template/lib/exercises.fixture.ts`: snapshot of the 48 used exercises (`kind`, `primaryMuscles`, `equipment`), generated with jq from free-exercise-db@79ca7b4 using the R11 rule plus two overrides: Plank → timed, Chin-Up → `pull-up bar`

## Ready-made sets

| id | name | place | pairId | entries | est. min | muscles |
|---|---|---|---|---|---|---|
| home-bodyweight | Дом: без оборудования | home | full-body | 7 | 39 | quads, chest, glutes, lower back, abs |
| home-dumbbells-bar | Дом: гантели и турник | home | — | 8 | 55 | full body |
| gym-full-body | Зал: всё тело | gym | full-body | 8 | 59 | full body |
| gym-push | Зал: жим | gym | — | 7 | 52 | chest, shoulders, triceps |
| gym-pull | Зал: тяга | gym | — | 7 | 52 | lower back, lats, middle back, shoulders, biceps |
| gym-legs | Зал: ноги | gym | — | 7 | 57 | quads, hamstrings, calves |
| stretching | Растяжка | home | — | 8 | 19 | 7 groups |
| cardio-intervals | Кардио-интервалы | gym | — | 6 | 53 | quads |

All exercises are beginner or intermediate level and have 2 photos. The home sets use only `body only` or `null` equipment (set 1), plus dumbbells and the pull-up bar (set 2). Volumes: 2–4 sets, 5–15 reps, 20–40 s holds, 45–180 s rest.

## Public API (`@/entities/template`)

```ts
readyTemplatesQuery          // queryOptions: key ['ready-templates'], fetch('/catalog/templates.json'), throws on !ok, staleTime Infinity
useReadyTemplates(): UseQueryResult<ReadyTemplate[]>
interface ExerciseFacts { kind: 'strength'|'bodyweight'|'timed'|'cardio'; primaryMuscles: readonly string[]; equipment: string | null }
needsGym(exercise: ExerciseFacts, homeEquipment: readonly string[]): boolean   // equipment not null, not 'body only', not in home list
gymOnlyCount(template: { entries }, exercisesById, homeEquipment): number
placeOf(template: { entries }, exercisesById, homeEquipment): 'home' | 'gym'
estimateDurationMin(template: { entries }, exercisesById): number   // round(Σ sets × (work + rest) + 60 s per exercise); work = durationSec for timed/cardio, reps × 4 otherwise
muscleGroupsOf(template: { entries }, exercisesById): string[]      // unique primary muscles in entry order
types: TemplateEntry, Template, ReadyTemplate, TemplateRef, Place
```

`exercisesById` is `Readonly<Record<string, ExerciseFacts | undefined>>`. An id missing from the map is ignored by `placeOf`, `gymOnlyCount` and `muscleGroupsOf`. For an unknown id, the duration uses whichever of `durationSec` / `reps` the entry has. The derivations take `{ entries }`, so they work for both `Template` and `ReadyTemplate`. The slice does not import `entities/exercise`: its `Exercise` (`kind: ExerciseKind`, `Muscle[]`, `Equipment | null`) structurally satisfies `ExerciseFacts`.

## Reconciling the types with `shared/api/schema`

`model/types.ts` holds plain interfaces. `Template` uses `import type { Timestamp } from 'firebase/firestore'` for `createdAt` / `updatedAt` and adds `id` (the doc id). Once the zod schemas exist:

- replace `TemplateEntry` and `Template` in `model/types.ts` with re-exports of `z.infer<typeof templateEntrySchema>` and `z.infer<typeof templateSchema> & { id: string }` from `@/shared/api`;
- `TemplateRef` belongs to the profile schema (`schedule`). Re-export it from there the same way, or keep it here if the schema does not define it;
- `ReadyTemplate` stays here (static asset, not in Firestore). It can be `Omit<TemplateEntry...>` based: `{ id, name, place, pairId?, entries: TemplateEntry[] }`.

Field names and optionality already match data-model.md, so the swap changes no consumers.

## Verification

```text
pnpm exec vitest run src/entities/template   → 2 files, 18 tests passed
pnpm exec eslint src/entities/template       → clean
pnpm exec prettier --check src/entities/template public/catalog/templates.json → clean
pnpm typecheck → no errors in my files; one error in another agent's file:
  src/shared/ui/page-header.tsx(2,1): error TS6133: 'cn' is declared but its value is never read.
pnpm exec steiger ./src → only "fsd/insignificant-slice: src/entities/template has no references".
  Expected: this is a warning by the owner's decision until the slice's consumers (pages/templates, today) exist.
```

## Lines for shared files

None needed. The test imports `public/catalog/templates.json` by relative path (Vite and tsc resolve JSON under `moduleResolution: bundler`).

## Decisions the owner may want to revisit

1. **pairId**: only `home-bodyweight` ↔ `gym-full-body` share `pairId: "full-body"`, as the task says. `home-dumbbells-bar` maps exercise-for-exercise to `gym-full-body` (squat, press, pull, row, hinge, overhead press, curl, plank) and may be the better partner. The data model allows only one home set per pair.
2. **Cardio-intervals is a gym set** (treadmill, rower, bikes, elliptical). In the dataset, home cardio without equipment is either `body only` (so `kind` = bodyweight, reps) or `null` equipment that becomes strength. That gives no timed intervals.
3. **Stretching is `place: home`**: all its exercises have `null` equipment.
4. **`placeOf` ignores the stored `place`**: it derives the place from the person's home equipment. Example: `home-dumbbells-bar` is `gym` for a person with no dumbbells. The stored `place` / `pairId` are the author's grouping.
5. **`null` equipment counts as body weight** in `needsGym`: about 100 stretches and drills in the dataset have `null`.

## Open problems

- **Catalog dependency**: the data test relies on the catalog agent overriding **Plank → timed** and **Chin-Up → pull-up bar**. If its override list differs, the real catalog and my fixture disagree. Plank is the only override-dependent entry. Superman is `category: stretching`, so it is timed by the base rule.
- **Index changes I did not make**: `git status` shows `public/catalog/templates.json` and `src/entities/template/lib/exercises.fixture.ts` as staged (`A`). I never ran `git add`, so another process staged them. I left the index untouched. The staged fixture is older than the working copy (prettier ran after staging).
- **Not tested**: the query's `queryFn`, which is a plain fetch. It has no unit test.

# Report p2 — shell (second wave: A–G, T022, T024, integration)

All changes unstaged; no package installed; the index was never written (the owner staged some of
my files while I worked — `.env.example`, `package.json`, `vite.config.ts`, `tsconfig.node.json`
show `A` — that is their staging, not mine).

## A. shared/ui, one folder per component

- `src/shared/ui/<name>/{<name>.tsx, <name>.test.tsx?, index.ts}` for button, sheet, toast, chip,
  chip-row, switch, stat-row, badge, page-header, empty-state, demo. Files moved with `mv`.
- `src/shared/ui/index.ts` re-exports from the folders (public names unchanged).
- `demo.tsx` imports siblings through their folders (`../badge`), never a file.
- `components.json`: unchanged. The `ui` alias `@/shared/ui` still points the CLI at the right
  directory; it writes a flat file there, which you then move. README has a section
  "Adding a shadcn component" (scratch copy, or let it write the flat file and move it into its folder).
- Git sees the old flat `button.tsx`, `button.test.tsx`, `sheet.tsx` as `AD` (staged, deleted in the
  worktree): staging the move is the owner's step.

## B. One definition of Muscle, Equipment, ExerciseKind

- Source of truth: `src/shared/api/schema/documents.ts` (`muscleSchema`, `equipmentSchema`,
  `exerciseKindSchema` + `z.infer` types). Value lists already agreed (17 muscles; 12 dataset
  equipment values + `pull-up bar`; `null` equipment is `Equipment | null` on `Exercise`, not an
  enum value, so profile `homeEquipment` can never hold `null`).
- `entities/exercise`: `model/types.ts` keeps only `Exercise` and imports the three types from
  `@/shared/api`; `config/labels.ts` and `lib/exercise.ts` likewise; `index.ts` re-exports
  `Equipment`, `ExerciseKind`, `Muscle` from `@/shared/api`.
- `scripts/lib/derive.ts`: `import type { Equipment, ExerciseKind, Muscle } from
  '../../src/shared/api/schema/documents.ts'` and `import type { Exercise } from` the entity.
- `tsconfig.node.json`: added `paths: { "@/shared/api": ["./src/shared/api/schema/documents.ts"] }`
  with a comment. Reason: scripts type-check entity files (`model/types.ts`, `config/labels.ts`)
  that now import `@/shared/api`; the full barrel needs Vite env and DOM types (firebase.ts), the
  schema file does not. Runtime is unaffected (type-only imports, erased by Node type stripping and
  resolved by the Vite alias in Vitest). **Revisit?** The alternative is to give the node project
  `vite/client` + DOM types and the full `@/*` path.
- `entities/template`: `Template = WithId<Template document>` from `@/shared/api`;
  `TemplateEntry`, `TemplateRef` re-exported from `@/shared/api`; `ExerciseFacts` is now
  `{ kind: ExerciseKind; primaryMuscles: readonly Muscle[]; equipment: Equipment | null }` and
  `homeEquipment` is `readonly Equipment[]` in `needsGym` / `gymOnlyCount` / `placeOf`.
  `ReadyTemplate` and `Place` stay in the entity. The fixture type-checks against the stricter types.

## C. entities/profile (T022)

Files: `model/profile.ts` (+ test), `api/profile.ts` (+ test), `index.ts`.

```ts
type ProfilePatch = Partial<Omit<Profile, 'schedule' | 'updatedAt'>> & { schedule?: Partial<Profile['schedule']> }
const defaultProfile: Profile          // data-model.md defaults, updatedAt = Timestamp.fromMillis(0)
withDefaults(profile: Profile | null): Profile
mergeProfile(current: Profile, patch: ProfilePatch, now: Timestamp): Profile  // schedule merged per day
profileQueryKey(uid: string): readonly ['profile', string]
updateProfile(client: QueryClient, uid: string, patch: ProfilePatch): void
useProfile(uid: string): { profile: Profile | undefined; isPending; error; update(patch): void }
```

- `useProfile` = `useSnapshotQuery(profileQueryKey(uid), docSource(profileRef(uid)))`; a missing
  document becomes `defaultProfile` (one stable object, so no re-render churn).
- `updateProfile` builds the whole document (`mergeProfile` over cached data or defaults, `updatedAt
  = Timestamp.now()`), puts it in the query cache at once (so two quick updates do not lose the first
  before the snapshot arrives) and writes it with `fireWrite(() => setDoc(profileRef(uid), next))`
  — no merge option, no `updateDoc`, nothing awaited.
- **Decision to revisit**: before the first snapshot (`getQueryData` is `undefined`) it **throws**
  `Profile is not loaded yet` instead of writing defaults over a server document that has not
  arrived. Callers should only offer edits once `profile` is defined. Phase 4 sets
  `activeWorkoutId` through this; the today page has the profile loaded by then.
- `updatedAt` is the client clock (`Timestamp.now()`), as the converter rejects `serverTimestamp()`.
- Tests (8): defaults match data-model and pass `profileSchema`; `withDefaults` only for `null`;
  merge of top-level fields, per-day schedule merge, clearing a day; `updateProfile` writes the whole
  document without SetOptions, chains two updates, refuses before load (`setDoc` mocked).

## D. Router and shell (T024)

- `src/app/index.tsx`: `<RouterProvider router={router} />` from `react-router/dom`.
- `src/app/routes/index.tsx`: `createBrowserRouter`, every page via `lazy: { Component }`; route tree:
  `RootLayout` → [`ScreenLayout` → `/login`, `*`] · [`AuthGate` → [`NavLayout` → `ScreenLayout` →
  `/`, `/templates`, `/templates/new`, `/templates/:id`, `/exercises`, `/stats`, `/settings`] ·
  [`ScreenLayout` → `/session`, `/session/finish`]] · DEV only: [`NavLayout` → `/dev/ui` (UiDemo,
  lazy)]. `HydrateFallback: () => null` on the root (lazy routes on first load).
- `src/app/layout/`: `root-layout.tsx` (QueryProvider + Outlet + Toaster), `auth-gate.tsx`
  (renders `<Outlet />`; one-line comment: Phase 3 T027 plugs the check and redirects in here),
  `nav-layout.tsx` (AppNav + content padding `56px + safe area` on phones, `padding-left: 220px`
  from 900px), `screen-layout.tsx` (`<main>` = the prototypes' `.screen`: max 1200, 12/16/24 →
  28/40/40, gap 20 → 28).
- `src/pages/<name>/{ui/<name>-page.tsx, index.ts}` for login, today, templates, template-edit,
  exercises, session, finish, stats, settings, not-found. Each renders `PageHeader` (prototype title)
  and `EmptyState` «Скоро здесь» naming the phase from tasks.md (today 4/8, templates and editor 6,
  exercises 5, session and finish 4, stats 9, settings 5/10, login 3). Not-found: «Страница не
  найдена» with `Button asChild` → `Link` «На главную».
- `src/widgets/app-nav/`: `AppNav()` — `nav[data-app-nav][aria-label="Разделы"]`, brand
  «PERSONAL / WORKOUT» shown from 900px, five `NavLink`s (Сегодня `/` with `end`, Наборы, Упражнения,
  Статистика, Профиль) with the prototype's inline SVG paths, `aria-current="page"` from NavLink,
  accent line on top (phones) / left (sidebar), safe-area inset. Measured against home.html in
  Chromium: nav box, brand box, link boxes, icon positions, font sizes/line-heights and the accent
  line are identical at 1280×800 and 390×844 (one fix made: label line-height `normal`).
- Test `src/widgets/app-nav/ui/app-nav.test.tsx` (4): order/labels/hrefs; only `/` current on `/`;
  Наборы current on `/templates/abc`; none on `/dev/ui`.
- `/dev/ui` exists only when `import.meta.env.DEV`; checked: no demo strings in `dist/assets`.

## E. Integration

- `package.json`: `"catalog": "node scripts/fetch-catalog.ts && node scripts/build-catalog.ts"`;
  `check` starts with `pnpm catalog`.
- `.env.example`: the api report's keys, **commented out** — `firebase.ts` falls back with `??`, so
  an empty `VITE_FIREBASE_API_KEY=` copied into `.env.local` would override the default with `''`.
- `vite.config.ts`: `server: { allowedHosts: ['.ts.net'] }` (covers <tailscale-host> and
  any `*.ts.net`).
- `e2e/smoke.spec.ts`: dark theme + nav visible on `/`; bottom bar (full width, at the bottom, ≤ 80px)
  under 900px and sidebar (x 0, 220px, full height) above; clicking each destination shows its h1 and
  `aria-current`; `/session` has no navigation; unknown route → «На главную» → Сегодня; no horizontal
  overflow at 360px on all 11 routes (mobile project only).
- README: `pnpm catalog` in setup with the ~100 MB note, `.env.example`, `/dev/ui`, Tailscale names,
  the shadcn section, `check` row.

## F. Clean check

Run in a copy (see Open problems): `rm -rf node_modules dist && pnpm install --frozen-lockfile && pnpm check`.

```
install --frozen-lockfile   exit 0, 1400 packages from the local store, 0 downloaded (≈1 s)
pnpm check                  exit 0, 84 s wall in total
  catalog     Fetching https://github.com/yuhonas/free-exercise-db at 79ca7b4… (the copy had no
              .catalog-cache/.git, so it fetched) → Built 876 exercises
  typecheck   tsc -b, clean
  test        Test Files 24 passed (24), Tests 181 passed (181), 1.67 s
  build       ok; Vite warns the main chunk is > 500 kB (see decisions)
  lint        eslint, prettier, steiger (3 warnings below), colour check: clean
  test:rules  Test Files 1 passed (1), Tests 1 passed (1), 0.79 s
  e2e         9 passed, 1 skipped (360px check runs in the mobile project only), 10.4 s
  audit       6 vulnerabilities (2 low, 4 moderate; 1 high ignored by config), exit 0
  audit signatures  1484 packages have verified registry signatures
pnpm-lock.yaml sha256 ea4148f6… before, after (repo) and in the copy: identical
```

## G. Screenshots

`<scratchpad>/shots/`:
`p2-home-m.png` (`/`), `p2-exercises-m.png`, `p2-session-m.png`, `p2-dev-ui-m.png` (390×844),
`p2-home-d.png`, `p2-stats-d.png`, `p2-dev-ui-d.png` (1280×800); prototype references
`proto-home-m.png`, `proto-home-d.png`. Taken against my own Vite on 127.0.0.1:5180 (stopped
afterwards); the owner's server on <tailscale-ip>:5173 was not touched.

## Steiger

```
┌ src/entities/exercise   ⚠ This slice has no references. Consider removing it.  fsd/insignificant-slice
┌ src/entities/profile    ⚠ This slice has no references. Consider removing it.  fsd/insignificant-slice
┌ src/entities/template   ⚠ This slice has no references. Consider removing it.  fsd/insignificant-slice
Found 3 warnings (none can be fixed automatically)
```

Single-consumer / no-consumer warnings (owner's decision, warn until T079): `entities/exercise`,
`entities/profile`, `entities/template` have no references yet. `widgets/app-nav` and the pages are
referenced from `app` and are not flagged.

## Decisions the owner may want to revisit

1. `tsconfig.node.json` maps `@/shared/api` to the schema file only (section B).
2. `updateProfile` throws before the profile is loaded (section C).
3. Layout split into `NavLayout` (nav + padding) and `ScreenLayout` (`<main>` container) so pages
   render only their content; `/session` will likely want its own full-bleed layout in Phase 4.
4. Not-found is outside the auth gate and without navigation.
5. Placeholder wording: «Скоро здесь» + «… появится в фазе N.» (phases of tasks.md).
6. The main chunk is 1.09 MB (332 kB gzip): Firebase Auth + Firestore + zod load with the root
   layout's QueryProvider → `@/shared/api`. Vite prints its 500 kB warning; pages are separate
   chunks of < 0.5 kB.

## Open problems

- `playwright.config.ts` reuses any server on `http://127.0.0.1:5173` locally. The owner's dev server
  listens on the Tailscale IP only, so `pnpm e2e` starts its own on 127.0.0.1 (Vite notes "Port 5173 is
  in use on a wildcard address, but 127.0.0.1:5173 is available"). If the owner ever binds
  127.0.0.1:5173, e2e runs against that server.
- The clean check ran in a copy of the repository (rsync without `node_modules`, `dist`, `.git`),
  not in place: `rm -rf node_modules` in the real tree would have pulled the modules from under the
  owner's running Vite. rsync's `--exclude .git` also dropped `.catalog-cache/.git`, so the catalog
  step re-fetched the dataset from GitHub (a real cold-fetch path, verified against the manifest).
- `pnpm audit` reports 6 low/moderate advisories and exits 0 under the current audit config; not
  investigated here.
