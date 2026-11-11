# Data Model: Personal Workout App (v1)

Two kinds of data: **static assets** shipped with the app (shared, read-only) and **per-user
documents** in Firestore under `/users/{uid}`. Nothing else exists in Firestore.

## Static assets (no Firestore reads)

### Exercise (catalog)

Source: free-exercise-db at a pinned commit, downloaded and checksum-verified at build time,
converted to `catalog/exercises.json`; photos at `catalog/images/<exerciseId>/0.jpg` and `1.jpg`.
Neither is committed.

| Field | Type | Notes |
|---|---|---|
| `id` | string | dataset id, e.g. `Barbell_Bench_Press_-_Medium_Grip` |
| `name` | string | English in v1 |
| `kind` | `'strength' \| 'bodyweight' \| 'timed' \| 'cardio'` | derived at build time from dataset `category` and `equipment` (rule in research.md) |
| `primaryMuscles`, `secondaryMuscles` | `Muscle[]` | 17 dataset muscles |
| `equipment` | `Equipment \| null` | dataset values plus `pull-up bar`, assigned by an override list |
| `instructions` | `string[]` | technique steps |
| `images` | `string[]` | relative paths |

### Ready-made set (template)

`catalog/templates.json`, written by hand, same shape as a user's template plus `place` and an
optional `pairId` linking the home and gym variants of one workout.

## Firestore documents

All timestamps are client `Timestamp`s. All ids are client-generated, so every write works offline.

### `/users/{uid}` — profile and settings (1 document)

| Field | Type | Default |
|---|---|---|
| `homeEquipment` | `Equipment[]` | `[]` (body weight is implicit) |
| `defaultRestSec` | number | 90 |
| `defaultWeightStepKg` | `0.5 \| 1 \| 2.5 \| 5` | 2.5 |
| `sounds`, `animations` | boolean | true |
| `schedule` | `{ mon..sun: TemplateRef[] }` (0–5 per day, in order) | all empty |
| `activeWorkoutId` | string \| null | id of the workout in progress |
| `updatedAt` | Timestamp | |

`TemplateRef = { source: 'own' \| 'ready', id: string }`.

### `/users/{uid}/templates/{templateId}` — a person's set of exercises

| Field | Type | Rules |
|---|---|---|
| `name` | string | 1–60 chars |
| `entries` | `TemplateEntry[]` | 1–40 items, order = array order |
| `copiedFrom` | string \| null | ready-made id |
| `createdAt`, `updatedAt` | Timestamp | |

`TemplateEntry = { exerciseId, sets (1–20), reps? (1–200), durationSec? (5–7200), restSec (0–900) }` —
`reps` for strength and bodyweight, `durationSec` for timed and cardio. "Home/gym", duration and
muscle groups of a set are derived on the client, never stored.

### `/users/{uid}/workouts/{workoutId}` — one session, in progress or finished

| Field | Type | Notes |
|---|---|---|
| `status` | `'active' \| 'done'` | |
| `startedAt`, `endedAt` | Timestamp | `endedAt` null while active |
| `template` | `{ source, id, name }` | name is a snapshot |
| `entries` | `WorkoutEntry[]` | in the order done; ≤ 60 |
| `survey` | `{ wellbeing?: 1–5, energy?: 1–5, bodyWeightKg?: number }` | each key optional |
| `summary` | `{ durationSec, volumeKg, setsDone, muscleSets: Record<Muscle, number> }` | written at finish; cache of derived values for statistics |
| `updatedAt` | Timestamp | last-write-wins across devices |

`WorkoutEntry = { exerciseId, name, kind, status: 'pending' \| 'postponed' \| 'done' \| 'skipped', plan: { sets, reps?, durationSec?, restSec }, sets: LoggedSet[] }`

`LoggedSet = { n, reps?, weightKg?, durationSec?, at: Timestamp }`

A whole workout is one document: 60 entries × 20 sets stays far below the 1 MiB limit, a workout
saves with one write, and a week of statistics is at most 7 reads.

### `/users/{uid}/exerciseStats/{exerciseId}` — per-exercise memory

| Field | Type | Notes |
|---|---|---|
| `weightStepKg` | number \| null | overrides the default step |
| `lastSets` | `{ reps?, weightKg?, durationSec? }[]` | per set number, from the last finished workout with this exercise |
| `lastWorkoutId`, `lastAt` | string, Timestamp | |
| `records` | `{ maxWeightKg?, maxVolumeKg?, bestSet?: { reps, weightKg, e1rmKg } }` | derived; updated at finish |

This is a cache of data derivable from `workouts`: it makes the prediction for the rest screen one
local read. It is rebuilt from workouts if missing.

## Derived values (client logic, unit-tested)

| Value | Rule |
|---|---|
| Prediction for set N | `lastSets[N-1]`, else the last known set, else the plan with no weight; plus the weight shift chosen earlier in this exercise today |
| Volume | Σ reps × weightKg over logged sets |
| Best set | highest estimated 1RM, Epley: `weight × (1 + reps / 30)` |
| Muscle load | per logged set: +1 for each primary muscle, +0.5 for each secondary; the weekly map shows four levels per muscle: 0, under 10, 10–20 and over 20 sets (owner, 2026-11-11) |
| "Gym" mark | exercise equipment not in `homeEquipment` and not body weight |
| Estimated duration | Σ over entries: sets × (work time + rest), where work time is `durationSec` or `reps × 4 s`, plus 1 min per exercise for the transition to it (kept by the owner, 2026-11-11) |

## State transitions

```text
Workout:  (none) --start--> active --finish--> done
                              |  \--discard (0 sets)--> deleted
Entry:    pending --all sets logged--> done
          pending --skip--> postponed --resume--> pending (logged sets kept)
          postponed --workout finished--> skipped
          done --go back--> pending (sets kept, editable)
```

A set of today's schedule counts as done when a `done` workout started today has the same
`template.source` and `template.id`, or is the home/gym counterpart of that set (same `pairId`). A day is done when every planned set is done.

Only one workout per person is `active`; `users/{uid}.activeWorkoutId` points to it.

## Running session (device-local, not Firestore)

Zustand store persisted to `localStorage`: `workoutId`, current entry and set index, queue of
entries, `startedAt`, `exerciseStartedAt`, `restEndsAt`, today's weight shift per exercise. Timers
are computed from these timestamps on every tick, never accumulated, so they stay correct after
sleep, reload or a closed app. After every logged set the workout document is written to Firestore
without awaiting the result.

## Volumes (Spark limits: 50K reads, 20K writes per day)

A workout of 8 exercises × 4 sets ≈ 35 writes and under 20 reads. Opening statistics reads the
whole history in one query (≈150 workouts a year at three a week), served from the local cache afterwards. Five active users stay under 1% of the
daily quota.
