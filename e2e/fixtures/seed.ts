// Seeds Firestore for an e2e user through the emulator's REST API as owner (rules bypassed).
// Every document is validated by its zod schema first; workouts are finished by the app's own builder.
//
//   import { seedProfile, seedTemplates, seedWorkouts } from './fixtures/seed'
//   await signIn(page, { uid: 'u1', email: 'u1@example.com' })
//   await seedProfile('u1', { homeEquipment: ['dumbbell'] })
//   await seedTemplates('u1', [{ id: 't1', name: 'Push', entries: [{ exerciseId: 'Pushups', sets: 3, reps: 10, restSec: 60 }] }])
//   await seedWorkouts('u1', [{ id: 'w1', startedAt: new Date(2026, 10, 9, 18), template: { source: 'own', id: 't1', name: 'Push' },
//     entries: [{ exerciseId: 'Pushups', sets: [{ reps: 12 }, { reps: 10 }] }], survey: { bodyWeightKg: 80 } }])
//
// The fixture in ./auth resets the emulators before each test, so seeds never leak between tests.
import { readFileSync } from 'node:fs'

import { Timestamp } from 'firebase/firestore'

import {
  profileSchema,
  templateSchema,
  workoutSchema,
  type LoggedSet,
  type Profile,
  type Template,
  type Workout,
  type WorkoutEntry,
} from '@/shared/api'

import { defaultProfile } from '../../src/entities/profile/model/profile'
import { finishedWorkout } from '../../src/entities/workout/api/documents'
import type { MuscleFacts } from '../../src/entities/workout/model/summary'
import { firestoreEmulator, projectId } from './emulators'

const root = `projects/${projectId}/databases/(default)/documents`

type Value =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { timestampValue: string }
  | { arrayValue: { values: Value[] } }
  | { mapValue: { fields: Record<string, Value> } }

// The REST API's typed JSON; integers as integerValue, like the SDK, so `is int` rules hold.
function encode(value: unknown): Value {
  if (value === null) return { nullValue: null }
  if (value instanceof Timestamp) return { timestampValue: value.toDate().toISOString() }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number')
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  if (typeof value === 'string') return { stringValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } }
  if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } }

  throw new Error(`Cannot seed a value of type ${typeof value}`)
}

const encodeFields = (data: object) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, encode(v)]),
  )

// One commit, so a seed call lands whole or not at all.
async function commit(docs: { path: string; data: object }[]): Promise<void> {
  const response = await fetch(`${firestoreEmulator}/v1/${root}:commit`, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: docs.map(({ path, data }) => ({
        update: { name: `${root}/${path}`, fields: encodeFields(data) },
      })),
    }),
  })

  if (!response.ok) throw new Error(`Seeding failed: ${response.status} ${await response.text()}`)
}

const now = () => Timestamp.now()

export async function seedProfile(uid: string, profile: Partial<Profile> = {}): Promise<void> {
  const data = profileSchema.parse({ ...defaultProfile, updatedAt: now(), ...profile })

  await commit([{ path: `users/${uid}`, data }])
}

export type SeedTemplate = Pick<Template, 'name' | 'entries'> & Partial<Template> & { id: string }

export async function seedTemplates(uid: string, templates: SeedTemplate[]): Promise<void> {
  await commit(
    templates.map(({ id, ...template }) => ({
      path: `users/${uid}/templates/${id}`,
      data: templateSchema.parse({
        copiedFrom: null,
        createdAt: now(),
        updatedAt: now(),
        ...template,
      }),
    })),
  )
}

interface CatalogExercise extends MuscleFacts {
  id: string
  name: string
  kind: WorkoutEntry['kind']
}

let catalog: Map<string, CatalogExercise> | undefined

// Built by `pnpm catalog`, which `pnpm check` runs first.
function exercise(id: string) {
  catalog ??= new Map(
    (JSON.parse(readFileSync('public/catalog/exercises.json', 'utf8')) as CatalogExercise[]).map(
      (e) => [e.id, e],
    ),
  )

  return catalog.get(id)
}

export interface SeedWorkout {
  id: string
  startedAt: Date
  // Defaults to 45 minutes after startedAt.
  endedAt?: Date
  template: Workout['template']
  // Logged sets in order; name, kind and muscles come from the catalog.
  entries: { exerciseId: string; sets: Omit<LoggedSet, 'n' | 'at'>[] }[]
  survey?: Workout['survey']
}

function entryOf(
  { exerciseId, sets }: SeedWorkout['entries'][number],
  startedAt: Date,
): WorkoutEntry {
  const facts = exercise(exerciseId)
  const timed = sets[0]?.durationSec !== undefined

  return {
    exerciseId,
    name: facts?.name ?? exerciseId,
    kind: facts?.kind ?? 'strength',
    status: 'done',
    plan: {
      sets: Math.max(1, sets.length),
      ...(timed ? { durationSec: sets[0]?.durationSec ?? 60 } : { reps: sets[0]?.reps ?? 10 }),
      restSec: 90,
    },
    sets: sets.map((set, i) => ({
      ...set,
      n: i + 1,
      at: Timestamp.fromMillis(startedAt.getTime() + (i + 1) * 60_000),
    })),
  }
}

export async function seedWorkouts(uid: string, workouts: SeedWorkout[]): Promise<void> {
  await commit(
    workouts.map((seed) => {
      const startedAt = Timestamp.fromDate(seed.startedAt)
      const endedAt = Timestamp.fromDate(
        seed.endedAt ?? new Date(seed.startedAt.getTime() + 45 * 60_000),
      )
      const entries = seed.entries.map((entry) => entryOf(entry, seed.startedAt))
      const active: Workout = {
        status: 'active',
        startedAt,
        endedAt,
        template: seed.template,
        entries,
        survey: seed.survey ?? {},
        summary: null,
        updatedAt: startedAt,
      }
      const facts = Object.fromEntries(entries.map((e) => [e.exerciseId, exercise(e.exerciseId)]))

      return {
        path: `users/${uid}/workouts/${seed.id}`,
        data: workoutSchema.parse(finishedWorkout(active, facts, endedAt)),
      }
    }),
  )
}
