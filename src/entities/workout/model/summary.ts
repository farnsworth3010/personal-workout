import type { ExerciseStats, LoggedSet, Muscle, WorkoutEntry } from '@/shared/api'

// The exercise data muscle load needs; entities/exercise satisfies it structurally.
export interface MuscleFacts {
  primaryMuscles: readonly Muscle[]
  secondaryMuscles: readonly Muscle[]
}

export type Records = ExerciseStats['records']

export type RecordKey = keyof Records

type Sets = readonly Omit<LoggedSet, 'n' | 'at'>[]

type Entries = readonly { exerciseId: WorkoutEntry['exerciseId']; sets: Sets }[]

const round = (kg: number) => Math.round(kg * 100) / 100

// Epley estimate of the one-rep max.
export const e1rm = (weightKg: number, reps: number) => round(weightKg * (1 + reps / 30))

const setVolume = ({ reps, weightKg }: Sets[number]) => (reps ?? 0) * (weightKg ?? 0)

const volumeOfSets = (sets: Sets) => round(sets.reduce((sum, set) => sum + setVolume(set), 0))

export const volumeKg = (entries: Entries) => volumeOfSets(entries.flatMap((entry) => entry.sets))

export const setsDone = (entries: Entries) =>
  entries.reduce((sum, entry) => sum + entry.sets.length, 0)

// Per logged set: +1 for each primary muscle, +0.5 for each secondary.
export function muscleSets(
  entries: Entries,
  factsById: Readonly<Record<string, MuscleFacts | undefined>>,
) {
  const load: Partial<Record<Muscle, number>> = {}

  const add = (muscles: readonly Muscle[], sets: number) => {
    for (const muscle of muscles) load[muscle] = (load[muscle] ?? 0) + sets
  }

  for (const { exerciseId, sets } of entries) {
    const facts = factsById[exerciseId]

    if (!facts || sets.length === 0) continue

    add(facts.primaryMuscles, sets.length)
    add(facts.secondaryMuscles, sets.length * 0.5)
  }

  return load
}

// Max weight, the exercise's volume in this workout and the best set by e1RM. Weightless sets and failed
// attempts (0 reps) set none, the same rule as the stats page.
export function recordsOf(sets: Sets): Records {
  const records: Records = {}

  for (const { reps, weightKg } of sets) {
    if (!weightKg || !reps) continue

    records.maxWeightKg = Math.max(records.maxWeightKg ?? 0, weightKg)

    const e1rmKg = e1rm(weightKg, reps)

    if (e1rmKg > (records.bestSet?.e1rmKg ?? 0)) records.bestSet = { reps, weightKg, e1rmKg }
  }

  const volume = volumeOfSets(sets)

  if (volume > 0) records.maxVolumeKg = volume

  return records
}

// An exercise done twice in one workout counts as one, so its volume adds up.
export function recordsByExercise(entries: Entries) {
  const sets: Record<string, Sets[number][]> = {}

  for (const entry of entries) (sets[entry.exerciseId] ??= []).push(...entry.sets)

  return Object.fromEntries(Object.entries(sets).map(([id, list]) => [id, recordsOf(list)]))
}

// Merges this workout's records into the stored ones. Only a beaten earlier value is "new": a first
// workout, or a key the exercise never had (push-ups first done with weight), is stored silently.
export function compareRecords(previous: Records | undefined, current: Records) {
  const improved: RecordKey[] = []

  const beats = (key: RecordKey, value: number | undefined, before: number | undefined) => {
    if (value === undefined) return false
    if (before === undefined) return true
    if (value <= before) return false

    improved.push(key)

    return true
  }

  const merged: Records = { ...previous }

  if (beats('maxWeightKg', current.maxWeightKg, previous?.maxWeightKg))
    merged.maxWeightKg = current.maxWeightKg

  if (beats('maxVolumeKg', current.maxVolumeKg, previous?.maxVolumeKg))
    merged.maxVolumeKg = current.maxVolumeKg

  if (beats('bestSet', current.bestSet?.e1rmKg, previous?.bestSet?.e1rmKg))
    merged.bestSet = current.bestSet

  return { merged, improved }
}
