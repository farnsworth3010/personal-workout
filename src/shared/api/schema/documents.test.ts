import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import type { z } from 'zod'

import {
  exerciseStatsSchema,
  profileSchema,
  templateSchema,
  workoutSchema,
  type ExerciseStats,
  type Profile,
  type Template,
  type TemplateEntry,
  type Workout,
  type WorkoutEntry,
} from './documents'

const at = Timestamp.fromMillis(1_700_000_000_000)
const ref = { source: 'own', id: 't1' } as const

const profile = (): Profile => ({
  homeEquipment: [],
  defaultRestSec: 90,
  defaultWeightStepKg: 2.5,
  sounds: true,
  animations: true,
  schedule: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  activeWorkoutId: null,
  updatedAt: at,
})

const entry = (): TemplateEntry => ({ exerciseId: 'Pushups', sets: 3, reps: 10, restSec: 90 })

const template = (): Template => ({
  name: 'Full body',
  entries: [entry()],
  copiedFrom: null,
  createdAt: at,
  updatedAt: at,
})

const workoutEntry = (): WorkoutEntry => ({
  exerciseId: 'Pushups',
  name: 'Pushups',
  kind: 'bodyweight',
  status: 'done',
  plan: { sets: 3, reps: 10, restSec: 90 },
  sets: [{ n: 1, reps: 10, at }],
})

const workout = (): Workout => ({
  status: 'done',
  startedAt: at,
  endedAt: at,
  template: { source: 'ready', id: 'home-basic', name: 'Home basic' },
  entries: [workoutEntry()],
  survey: { wellbeing: 4 },
  summary: { durationSec: 1800, volumeKg: 0, setsDone: 1, muscleSets: { chest: 1, triceps: 0.5 } },
  updatedAt: at,
})

const stats = (): ExerciseStats => ({
  weightStepKg: null,
  lastSets: [{ reps: 8, weightKg: 60 }],
  lastWorkoutId: 'w1',
  lastAt: at,
  records: { maxWeightKg: 60, bestSet: { reps: 8, weightKg: 60, e1rmKg: 76 } },
})

const repeat = <T>(n: number, make: () => T) => Array.from({ length: n }, make)

type Case = [label: string, value: unknown, valid: boolean]

const check = (schema: z.ZodType, cases: Case[]) =>
  it.each(cases)('%s', (_, value, valid) => {
    expect(schema.safeParse(value).success).toBe(valid)
  })

describe('profileSchema', () => {
  check(profileSchema, [
    ['defaults', profile(), true],
    ['rest 0 s', { ...profile(), defaultRestSec: 0 }, true],
    ['rest 900 s', { ...profile(), defaultRestSec: 900 }, true],
    ['rest 901 s', { ...profile(), defaultRestSec: 901 }, false],
    ['rest -1 s', { ...profile(), defaultRestSec: -1 }, false],
    ['weight step 0.5', { ...profile(), defaultWeightStepKg: 0.5 }, true],
    ['weight step 5', { ...profile(), defaultWeightStepKg: 5 }, true],
    ['weight step 2', { ...profile(), defaultWeightStepKg: 2 }, false],
    ['pull-up bar at home', { ...profile(), homeEquipment: ['pull-up bar'] }, true],
    ['unknown equipment', { ...profile(), homeEquipment: ['sofa'] }, false],
    [
      'schedule with two sets on a day',
      {
        ...profile(),
        schedule: { ...profile().schedule, mon: [ref, { source: 'ready', id: 'r' }] },
      },
      true,
    ],
    [
      'five sets on a day',
      { ...profile(), schedule: { ...profile().schedule, mon: Array(5).fill(ref) } },
      true,
    ],
    [
      'six sets on a day',
      { ...profile(), schedule: { ...profile().schedule, mon: Array(6).fill(ref) } },
      false,
    ],
    [
      'a single ref instead of a list',
      { ...profile(), schedule: { ...profile().schedule, mon: ref } },
      false,
    ],
    [
      'null instead of a list',
      { ...profile(), schedule: { ...profile().schedule, mon: null } },
      false,
    ],
    [
      'schedule with a bad source',
      { ...profile(), schedule: { ...profile().schedule, mon: [{ source: 'x', id: 't1' }] } },
      false,
    ],
    ['schedule missing a day', { ...profile(), schedule: { mon: [] } }, false],
    ['unknown top-level key', { ...profile(), theme: 'light' }, false],
    ['updatedAt as Date', { ...profile(), updatedAt: new Date() }, false],
  ])
})

describe('templateSchema', () => {
  check(templateSchema, [
    ['valid', template(), true],
    ['name 1 char', { ...template(), name: 'a' }, true],
    ['name 60 chars', { ...template(), name: 'a'.repeat(60) }, true],
    ['name empty', { ...template(), name: '' }, false],
    ['name 61 chars', { ...template(), name: 'a'.repeat(61) }, false],
    ['40 entries', { ...template(), entries: repeat(40, entry) }, true],
    ['41 entries', { ...template(), entries: repeat(41, entry) }, false],
    ['no entries', { ...template(), entries: [] }, false],
    ['copied from a ready-made set', { ...template(), copiedFrom: 'gym-push' }, true],
    ['unknown top-level key', { ...template(), place: 'home' }, false],
    ['1 set', { ...template(), entries: [{ ...entry(), sets: 1 }] }, true],
    ['20 sets', { ...template(), entries: [{ ...entry(), sets: 20 }] }, true],
    ['0 sets', { ...template(), entries: [{ ...entry(), sets: 0 }] }, false],
    ['21 sets', { ...template(), entries: [{ ...entry(), sets: 21 }] }, false],
    ['200 reps', { ...template(), entries: [{ ...entry(), reps: 200 }] }, true],
    ['0 reps', { ...template(), entries: [{ ...entry(), reps: 0 }] }, false],
    ['201 reps', { ...template(), entries: [{ ...entry(), reps: 201 }] }, false],
    ['2.5 reps', { ...template(), entries: [{ ...entry(), reps: 2.5 }] }, false],
    ['rest 0 s', { ...template(), entries: [{ ...entry(), restSec: 0 }] }, true],
    ['rest 900 s', { ...template(), entries: [{ ...entry(), restSec: 900 }] }, true],
    ['rest 901 s', { ...template(), entries: [{ ...entry(), restSec: 901 }] }, false],
    ...(
      [
        ['duration 5 s', 5, true],
        ['duration 7200 s', 7200, true],
        ['duration 4 s', 4, false],
        ['duration 7201 s', 7201, false],
      ] as const
    ).map(([label, durationSec, valid]): Case => [
      label,
      { ...template(), entries: [{ exerciseId: 'Plank', sets: 3, durationSec, restSec: 60 }] },
      valid,
    ]),
    [
      'both reps and duration',
      { ...template(), entries: [{ ...entry(), durationSec: 30 }] },
      false,
    ],
    [
      'neither reps nor duration',
      { ...template(), entries: [{ exerciseId: 'Pushups', sets: 3, restSec: 90 }] },
      false,
    ],
    ['empty exercise id', { ...template(), entries: [{ ...entry(), exerciseId: '' }] }, false],
  ])
})

describe('workoutSchema', () => {
  const withEntry = (patch: Partial<WorkoutEntry>) => ({
    ...workout(),
    entries: [{ ...workoutEntry(), ...patch }],
  })

  check(workoutSchema, [
    ['finished', workout(), true],
    ['active', { ...workout(), status: 'active', endedAt: null, summary: null, survey: {} }, true],
    ['unknown status', { ...workout(), status: 'paused' }, false],
    ['60 entries', { ...workout(), entries: repeat(60, workoutEntry) }, true],
    ['61 entries', { ...workout(), entries: repeat(61, workoutEntry) }, false],
    [
      'template name 61 chars',
      { ...workout(), template: { ...workout().template, name: 'a'.repeat(61) } },
      false,
    ],
    ['entry postponed', withEntry({ status: 'postponed' }), true],
    ['entry status unknown', withEntry({ status: 'later' as WorkoutEntry['status'] }), false],
    ['entry kind unknown', withEntry({ kind: 'yoga' as WorkoutEntry['kind'] }), false],
    ['plan 21 sets', withEntry({ plan: { sets: 21, reps: 10, restSec: 90 } }), false],
    ['plan without reps or duration', withEntry({ plan: { sets: 3, restSec: 90 } }), false],
    ['20 logged sets', withEntry({ sets: repeat(20, () => ({ n: 1, reps: 5, at })) }), true],
    ['21 logged sets', withEntry({ sets: repeat(21, () => ({ n: 1, reps: 5, at })) }), false],
    ['set number 0', withEntry({ sets: [{ n: 0, reps: 5, at }] }), false],
    ['negative weight', withEntry({ sets: [{ n: 1, reps: 5, weightKg: -1, at }] }), false],
    [
      'set without a timestamp',
      withEntry({ sets: [{ n: 1, reps: 5 } as WorkoutEntry['sets'][0]] }),
      false,
    ],
    ['wellbeing 1 and energy 5', { ...workout(), survey: { wellbeing: 1, energy: 5 } }, true],
    ['wellbeing 0', { ...workout(), survey: { wellbeing: 0 } }, false],
    ['energy 6', { ...workout(), survey: { energy: 6 } }, false],
    ['body weight 0', { ...workout(), survey: { bodyWeightKg: 0 } }, false],
    ['body weight 72.5', { ...workout(), survey: { bodyWeightKg: 72.5 } }, true],
    ['unknown survey key', { ...workout(), survey: { mood: 3 } }, false],
    [
      'unknown muscle in summary',
      { ...workout(), summary: { ...workout().summary, muscleSets: { wings: 1 } } },
      false,
    ],
  ])
})

describe('exerciseStatsSchema', () => {
  check(exerciseStatsSchema, [
    ['valid', stats(), true],
    ['weight step override', { ...stats(), weightStepKg: 1.25 }, true],
    ['weight step 0', { ...stats(), weightStepKg: 0 }, false],
    ['20 last sets', { ...stats(), lastSets: repeat(20, () => ({ reps: 5 })) }, true],
    ['21 last sets', { ...stats(), lastSets: repeat(21, () => ({ reps: 5 })) }, false],
    ['no records yet', { ...stats(), records: {} }, true],
    [
      'best set missing e1rm',
      { ...stats(), records: { bestSet: { reps: 5, weightKg: 50 } } },
      false,
    ],
    ['empty last workout id', { ...stats(), lastWorkoutId: '' }, false],
  ])
})
