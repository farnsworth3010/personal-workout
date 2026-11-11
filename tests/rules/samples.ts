import { Timestamp } from 'firebase/firestore'
import type { z } from 'zod'

import { exerciseStatsSchema, profileSchema, templateSchema, workoutSchema } from '@/shared/api'

const at = Timestamp.fromMillis(1_700_000_000_000)
const templateEntry = { id: 'a1', exerciseId: 'Pushups', sets: 3, reps: 10, restSec: 60 }
const workoutEntry = {
  id: 'a1',
  exerciseId: 'Pushups',
  name: 'Pushups',
  kind: 'bodyweight',
  status: 'done',
  plan: { sets: 1, reps: 10, restSec: 60 },
  sets: [{ n: 1, reps: 10, at }],
}

// Every sample carries every top-level key with a non-null value, and parses with its schema.
export const kinds = [
  {
    kind: 'profile',
    path: (uid: string) => `users/${uid}`,
    schema: profileSchema,
    sample: profileSchema.parse({
      homeEquipment: ['dumbbell', 'pull-up bar'],
      defaultRestSec: 90,
      defaultWeightStepKg: 2.5,
      sounds: true,
      animations: false,
      schedule: {
        mon: [{ source: 'own', id: 't1' }],
        tue: [],
        wed: [
          { source: 'ready', id: 'full-body' },
          { source: 'own', id: 't1' },
        ],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
      },
      activeWorkoutId: 'w1',
      timers: { exercise: true, rest: false, workout: true },
      updatedAt: at,
    }),
  },
  {
    kind: 'template',
    path: (uid: string) => `users/${uid}/templates/t1`,
    schema: templateSchema,
    sample: templateSchema.parse({
      name: 'Push',
      entries: [templateEntry],
      copiedFrom: 'full-body',
      createdAt: at,
      updatedAt: at,
    }),
  },
  {
    kind: 'workout',
    path: (uid: string) => `users/${uid}/workouts/w1`,
    schema: workoutSchema,
    sample: workoutSchema.parse({
      status: 'done',
      startedAt: at,
      endedAt: at,
      template: { source: 'own', id: 't1', name: 'Push' },
      entries: [workoutEntry],
      survey: { wellbeing: 4, energy: 3, bodyWeightKg: 80 },
      summary: { durationSec: 1800, volumeKg: 0, setsDone: 1, muscleSets: { chest: 1 } },
      updatedAt: at,
    }),
  },
  {
    kind: 'exerciseStats',
    path: (uid: string) => `users/${uid}/exerciseStats/Pushups`,
    schema: exerciseStatsSchema,
    sample: exerciseStatsSchema.parse({
      weightStepKg: 2.5,
      lastSets: [{ reps: 10, weightKg: 20 }],
      lastWorkoutId: 'w1',
      lastAt: at,
      records: {
        maxWeightKg: 20,
        maxVolumeKg: 200,
        bestSet: { reps: 10, weightKg: 20, e1rmKg: 26.7 },
      },
    }),
  },
] satisfies {
  kind: string
  path: (uid: string) => string
  schema: z.ZodObject
  sample: Record<string, unknown>
}[]

// Replacements for one top-level field; the schema decides whether each one is valid.
export const fieldValues: unknown[] = [true, '', 'x', 'x'.repeat(61), 7, 2.5, -1, null, [], {}]

const ref = { source: 'own', id: 't1' }
const week = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }

// Values the generic list above cannot reach: list caps, enum sets and nested key sets.
export const extraCases: { kind: string; patch: Record<string, unknown> }[] = [
  { kind: 'profile', patch: { homeEquipment: ['rope'] } },
  { kind: 'profile', patch: { defaultWeightStepKg: 0.5 } },
  { kind: 'profile', patch: { defaultWeightStepKg: 1 } },
  { kind: 'profile', patch: { defaultWeightStepKg: 0.25 } },
  { kind: 'profile', patch: { defaultRestSec: 900 } },
  { kind: 'profile', patch: { defaultRestSec: 901 } },
  { kind: 'profile', patch: { schedule: { mon: [] } } },
  { kind: 'profile', patch: { schedule: { ...week, mon: Array(5).fill(ref) } } },
  { kind: 'profile', patch: { schedule: { ...week, mon: Array(6).fill(ref) } } },
  { kind: 'profile', patch: { schedule: { ...week, mon: null } } },
  { kind: 'profile', patch: { schedule: { ...week, mon: ref } } },
  { kind: 'profile', patch: { timers: { exercise: false, rest: true, workout: false } } },
  { kind: 'profile', patch: { timers: { exercise: true, rest: true } } },
  {
    kind: 'profile',
    patch: { timers: { exercise: true, rest: true, workout: true, total: true } },
  },
  { kind: 'profile', patch: { timers: { exercise: 'no', rest: true, workout: true } } },
  { kind: 'template', patch: { name: 'x'.repeat(60) } },
  { kind: 'template', patch: { entries: Array(40).fill(templateEntry) } },
  { kind: 'template', patch: { entries: Array(41).fill(templateEntry) } },
  { kind: 'workout', patch: { status: 'active' } },
  { kind: 'workout', patch: { status: 'paused' } },
  { kind: 'workout', patch: { template: { source: 'shared', id: 't1', name: 'Push' } } },
  { kind: 'workout', patch: { template: { source: 'own', id: 't1', name: '' } } },
  { kind: 'workout', patch: { template: { source: 'own', id: 't1' } } },
  { kind: 'workout', patch: { entries: Array(60).fill(workoutEntry) } },
  { kind: 'workout', patch: { entries: Array(61).fill(workoutEntry) } },
  { kind: 'workout', patch: { survey: { mood: 3 } } },
  { kind: 'workout', patch: { summary: { durationSec: 1 } } },
  { kind: 'exerciseStats', patch: { lastSets: Array(20).fill({ reps: 1 }) } },
  { kind: 'exerciseStats', patch: { lastSets: Array(21).fill({ reps: 1 }) } },
  { kind: 'exerciseStats', patch: { records: { maxRepsKg: 1 } } },
  { kind: 'exerciseStats', patch: { weightStepKg: 0 } },
]
