import { describe, expect, it } from 'vitest'

import type { Exercise } from '@/entities/exercise'
import type { ExerciseKind } from '@/shared/api'

import { initialRows, previewEntries } from './rows'
import type { Row } from './types'

const kinds: Record<string, ExerciseKind> = {
  Squat: 'strength',
  Pushups: 'bodyweight',
  Plank: 'timed',
  Run: 'cardio',
}
const kindOf = (id: string) => kinds[id]

const row = (exerciseId: string, sets: string, amount: string, rest: string): Row => ({
  id: `${exerciseId}-id`,
  exerciseId,
  sets,
  amount,
  rest,
})

describe('previewEntries', () => {
  it('counts unreadable fields as zero and skips unknown exercises', () => {
    expect(
      previewEntries([row('Squat', '', 'abc', '60'), row('Gone', '3', '10', '90')], kindOf),
    ).toEqual([{ id: 'Squat-id', exerciseId: 'Squat', sets: 0, reps: 0, restSec: 60 }])
  })
})

describe('initialRows', () => {
  const squat: Exercise = {
    id: 'Squat',
    name: 'Squat',
    kind: 'strength',
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: 'barbell',
    instructions: [],
    images: [],
  }
  const byId = { Squat: squat }
  const pushups = { id: 'u1', exerciseId: 'Pushups', sets: 3, reps: 12, restSec: 60 }

  it('appends the ?add exercise once', () => {
    const rows = initialRows([pushups], 'Squat', byId, 120)

    expect(rows.map((r) => [r.exerciseId, r.rest])).toEqual([
      ['Pushups', ''],
      ['Squat', '120'],
    ])
    // Pushups is not in this catalog, so its entry is kept as stored.
    expect(rows.at(0)?.stored).toEqual(pushups)
  })

  it('adds a second copy of an exercise the set has, with its own id, and nothing unknown', () => {
    const squatEntry = { id: 's1', exerciseId: 'Squat', sets: 3, reps: 8, restSec: 90 }

    const rows = initialRows([squatEntry], 'Squat', byId, 120)
    expect(rows.map((r) => r.exerciseId)).toEqual(['Squat', 'Squat'])
    expect(rows.at(1)?.id).not.toBe('s1')
    expect(initialRows([], 'Nope', byId, 120)).toEqual([])
  })
})
