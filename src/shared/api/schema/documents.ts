import { Timestamp } from 'firebase/firestore'
import { z } from 'zod'

import { limits } from './limits'

// The 17 free-exercise-db muscles plus 'eyes' for local exercises.
export const muscleSchema = z.enum([
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'eyes',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower back',
  'middle back',
  'neck',
  'quadriceps',
  'shoulders',
  'traps',
  'triceps',
])

// free-exercise-db values plus `pull-up bar` from the catalog overrides (research R11).
const equipmentSchema = z.enum([
  'bands',
  'barbell',
  'body only',
  'cable',
  'dumbbell',
  'e-z curl bar',
  'exercise ball',
  'foam roll',
  'kettlebells',
  'machine',
  'medicine ball',
  'other',
  'pull-up bar',
])

const exerciseKindSchema = z.enum(['strength', 'bodyweight', 'timed', 'cardio'])

const timestamp = z.instanceof(Timestamp)
const id = z.string().min(1)
const templateName = z.string().min(1).max(limits.templateName.max)
const templateSource = z.enum(['own', 'ready'])
const kg = z.number().nonnegative()

const templateRefSchema = z.strictObject({ source: templateSource, id })

// Up to five sets per weekday, in the order the user arranged them.
const scheduleDay = z.array(templateRefSchema).max(limits.daySets.max)

// Which session timers are shown. Profiles written before the switches have none: they read as all on.
const timersSchema = z
  .strictObject({ exercise: z.boolean(), rest: z.boolean(), workout: z.boolean() })
  .default(() => ({ exercise: true, rest: true, workout: true }))

export const profileSchema = z.strictObject({
  homeEquipment: z.array(equipmentSchema),
  defaultRestSec: z.int().min(limits.restSec.min).max(limits.restSec.max),
  defaultWeightStepKg: z.union([z.literal(0.5), z.literal(1), z.literal(2.5), z.literal(5)]),
  sounds: z.boolean(),
  animations: z.boolean(),
  schedule: z.strictObject({
    mon: scheduleDay,
    tue: scheduleDay,
    wed: scheduleDay,
    thu: scheduleDay,
    fri: scheduleDay,
    sat: scheduleDay,
    sun: scheduleDay,
  }),
  timers: timersSchema,
  updatedAt: timestamp,
})

const planShape = {
  sets: z.int().min(limits.sets.min).max(limits.sets.max),
  reps: z.int().min(limits.reps.min).max(limits.reps.max).optional(),
  durationSec: z.int().min(limits.durationSec.min).max(limits.durationSec.max).optional(),
  restSec: z.int().min(limits.restSec.min).max(limits.restSec.max),
}

// Logged values may be 0 (a set cut short), up to the plan's maximum.
const loggedReps = z.int().min(0).max(limits.reps.max)
const loggedDuration = z.int().min(0).max(limits.durationSec.max)

const hasOneTarget = (plan: { reps?: number; durationSec?: number }) =>
  (plan.reps === undefined) !== (plan.durationSec === undefined)

const oneTarget = { message: 'Exactly one of reps and durationSec is required' }

// Each entry has its own id, stable across edits, so one exercise can appear several times in a set.
export const templateEntrySchema = z
  .strictObject({ id, exerciseId: id, ...planShape })
  .refine(hasOneTarget, oneTarget)

export const templateSchema = z.strictObject({
  name: templateName,
  entries: z.array(templateEntrySchema).min(1).max(limits.templateEntries.max),
  copiedFrom: id.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
})

const loggedSetSchema = z.strictObject({
  n: z.int().min(limits.sets.min).max(limits.sets.max),
  reps: loggedReps.optional(),
  weightKg: kg.optional(),
  durationSec: loggedDuration.optional(),
  at: timestamp,
})

const workoutEntrySchema = z.strictObject({
  id,
  exerciseId: id,
  name: z.string().min(1),
  kind: exerciseKindSchema,
  status: z.enum(['pending', 'postponed', 'done', 'skipped']),
  plan: z.strictObject(planShape).refine(hasOneTarget, oneTarget),
  sets: z.array(loggedSetSchema).max(limits.sets.max),
})

const rating = z.int().min(1).max(5)

export const workoutSchema = z.strictObject({
  status: z.enum(['active', 'done']),
  startedAt: timestamp,
  endedAt: timestamp.nullable(),
  template: z.strictObject({ source: templateSource, id, name: templateName }),
  entries: z.array(workoutEntrySchema).max(limits.workoutEntries.max),
  survey: z.strictObject({
    wellbeing: rating.optional(),
    energy: rating.optional(),
    bodyWeightKg: z.number().positive().optional(),
  }),
  // null until the workout is finished.
  summary: z
    .strictObject({
      durationSec: z.int().nonnegative(),
      volumeKg: kg,
      setsDone: z.int().nonnegative(),
      muscleSets: z.partialRecord(muscleSchema, z.number().nonnegative()),
    })
    .nullable(),
  updatedAt: timestamp,
})

export const exerciseStatsSchema = z.strictObject({
  weightStepKg: z.number().positive().nullable(),
  lastSets: z
    .array(
      z.strictObject({
        reps: loggedReps.optional(),
        weightKg: kg.optional(),
        durationSec: loggedDuration.optional(),
      }),
    )
    .max(limits.sets.max),
  lastWorkoutId: id,
  lastAt: timestamp,
  records: z.strictObject({
    maxWeightKg: kg.optional(),
    maxVolumeKg: kg.optional(),
    bestSet: z.strictObject({ reps: z.int().min(0), weightKg: kg, e1rmKg: kg }).optional(),
  }),
})

// Entries written before entry ids get one from their position: stable for an unchanged document, and
// unable to clash with the random ids of newer entries. Saving the document keeps them.
export function withEntryIds<T>(entries: readonly T[]): (T & { id: string })[] {
  return entries.map((entry, i) => {
    const { id } = entry as { id?: unknown }

    return { ...entry, id: typeof id === 'string' && id.length > 0 ? id : `e${String(i)}` }
  })
}

export type Muscle = z.infer<typeof muscleSchema>
export type Equipment = z.infer<typeof equipmentSchema>
export type ExerciseKind = z.infer<typeof exerciseKindSchema>
export type TemplateRef = z.infer<typeof templateRefSchema>
export type Profile = z.infer<typeof profileSchema>
export type TemplateEntry = z.infer<typeof templateEntrySchema>
export type Template = z.infer<typeof templateSchema>
export type LoggedSet = z.infer<typeof loggedSetSchema>
export type WorkoutEntry = z.infer<typeof workoutEntrySchema>
export type Workout = z.infer<typeof workoutSchema>
export type ExerciseStats = z.infer<typeof exerciseStatsSchema>
