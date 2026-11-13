import type {
  DocumentData,
  FirestoreDataConverter,
  PartialWithFieldValue,
  SetOptions,
} from 'firebase/firestore'
import type { z } from 'zod'

import {
  exerciseStatsSchema,
  profileSchema,
  templateSchema,
  withEntryIds,
  workoutSchema,
} from './documents'

// shortcut: FieldValue sentinels (deleteField, arrayUnion) fail validation; a merge write
// validates top-level keys only, so nested objects must be complete. Use whole-document writes.
export function zodConverter<S extends z.ZodObject>(
  schema: S,
  upgrade: (data: DocumentData) => DocumentData = (data) => data,
): FirestoreDataConverter<z.output<S>> {
  return {
    toFirestore(model: PartialWithFieldValue<z.output<S>>, options?: SetOptions) {
      return options ? schema.partial().parse(model) : schema.parse(model)
    },
    fromFirestore: (snapshot, options) => schema.parse(upgrade(snapshot.data(options))),
  }
}

// Profiles written before several sets per day hold one ref or null per weekday; some also carry
// the retired activeWorkoutId or places, which rules still allow so those documents stay writable.
function upgradeProfile(data: DocumentData): DocumentData {
  const current = { ...data }
  delete current.activeWorkoutId
  delete current.places
  const schedule: unknown = current.schedule
  if (typeof schedule !== 'object' || schedule === null) return current

  const days = Object.entries(schedule).map(([day, refs]: [string, unknown]): [string, unknown] => [
    day,
    refs === null || Array.isArray(refs) ? (refs ?? []) : [refs],
  ])

  return { ...current, schedule: Object.fromEntries(days) }
}

export function upgradeEntries(data: DocumentData): DocumentData {
  const entries: unknown = data.entries

  return Array.isArray(entries) ? { ...data, entries: withEntryIds(entries as object[]) } : data
}

export const profileConverter = zodConverter(profileSchema, upgradeProfile)
export const templateConverter = zodConverter(templateSchema, upgradeEntries)
export const workoutConverter = zodConverter(workoutSchema, upgradeEntries)
export const exerciseStatsConverter = zodConverter(exerciseStatsSchema)
