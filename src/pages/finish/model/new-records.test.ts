import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import type { ExerciseStats, WorkoutEntry } from '@/shared/api'

import { newRecords } from './new-records'

const stats = (records: ExerciseStats['records']): ExerciseStats => ({
  weightStepKg: null,
  lastSets: [],
  lastWorkoutId: 'w0',
  lastAt: Timestamp.fromMillis(0),
  records,
})

const bench = { exerciseId: 'Bench', name: 'Жим лёжа' } as WorkoutEntry

describe('newRecords', () => {
  it('lists the beaten records with the previous value', () => {
    const current = { Bench: { maxWeightKg: 62.5 } }

    expect(newRecords(current, { Bench: stats({ maxWeightKg: 60 }) }, [bench])).toEqual([
      { id: 'Bench', key: 'maxWeightKg', name: 'Жим лёжа', now: current.Bench, was: '60 кг' },
    ])
    expect(newRecords(current, { Bench: stats({ maxWeightKg: 70 }) }, [bench])).toEqual([])
  })

  it('waits for the stats, skips a first workout and names an unknown exercise by its id', () => {
    const current = { Row: { maxWeightKg: 50 } }

    expect(newRecords(current, undefined, [])).toEqual([])
    expect(newRecords(current, {}, [])).toEqual([])
    expect(newRecords(current, { Row: stats({ maxWeightKg: 45 }) }, [])).toEqual([
      { id: 'Row', key: 'maxWeightKg', name: 'Row', now: current.Row, was: '45 кг' },
    ])
  })
})
