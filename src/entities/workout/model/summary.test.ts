import { describe, expect, it } from 'vitest'

import {
  compareRecords,
  e1rm,
  muscleSets,
  recordsByExercise,
  recordsOf,
  setsDone,
  volumeKg,
} from './summary'

const bench = {
  exerciseId: 'Bench',
  sets: [
    { reps: 10, weightKg: 60 },
    { reps: 8, weightKg: 62.5 },
  ],
}

const plank = { exerciseId: 'Plank', sets: [{ durationSec: 45 }, { durationSec: 40 }] }

const pushups = { exerciseId: 'Pushups', sets: [{ reps: 15 }] }

const facts = {
  Bench: { primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'] },
  Plank: { primaryMuscles: ['abdominals'], secondaryMuscles: [] },
} as const

describe('volume and sets', () => {
  it('sums reps × weight over logged sets, ignoring sets without weight', () => {
    expect(volumeKg([bench, plank, pushups])).toBe(600 + 500)
  })

  it('counts every logged set', () => {
    expect(setsDone([bench, plank, pushups])).toBe(5)
    expect(setsDone([])).toBe(0)
  })
})

describe('muscleSets', () => {
  it('adds 1 per primary and 0.5 per secondary muscle for each set', () => {
    expect(muscleSets([bench, plank], facts)).toEqual({
      chest: 2,
      triceps: 1,
      shoulders: 1,
      abdominals: 2,
    })
  })

  it('adds up an exercise done twice and skips unknown exercises and empty entries', () => {
    const empty = { exerciseId: 'Bench', sets: [] }

    expect(muscleSets([bench, { ...bench, sets: [bench.sets[0]] }, empty, pushups], facts)).toEqual(
      { chest: 3, triceps: 1.5, shoulders: 1.5 },
    )
  })
})

describe('records', () => {
  it('estimates 1RM by Epley', () => {
    expect(e1rm(100, 0)).toBe(100)
    expect(e1rm(60, 10)).toBe(80)
    expect(e1rm(62.5, 8)).toBe(79.17)
  })

  it('finds max weight, volume and the best set by e1RM, not by weight', () => {
    expect(recordsOf(bench.sets)).toEqual({
      maxWeightKg: 62.5,
      maxVolumeKg: 1100,
      bestSet: { reps: 10, weightKg: 60, e1rmKg: 80 },
    })
  })

  it('has no records for sets without weight', () => {
    expect(recordsOf(pushups.sets)).toEqual({})
    expect(recordsOf([{ reps: 10, weightKg: 0 }])).toEqual({})
  })

  it('groups records by exercise across repeated entries', () => {
    const again = { exerciseId: 'Bench', sets: [{ reps: 5, weightKg: 70 }] }

    expect(recordsByExercise([bench, again, pushups])).toEqual({
      Bench: {
        maxWeightKg: 70,
        maxVolumeKg: 1450,
        bestSet: { reps: 5, weightKg: 70, e1rmKg: 81.67 },
      },
      Pushups: {},
    })
  })
})

describe('compareRecords', () => {
  const previous = {
    maxWeightKg: 62.5,
    maxVolumeKg: 1200,
    bestSet: { reps: 10, weightKg: 60, e1rmKg: 80 },
  }

  it('reports only strictly beaten records and keeps the better values', () => {
    const current = {
      maxWeightKg: 65,
      maxVolumeKg: 1200,
      bestSet: { reps: 3, weightKg: 65, e1rmKg: 71.5 },
    }

    expect(compareRecords(previous, current)).toEqual({
      merged: { ...previous, maxWeightKg: 65 },
      improved: ['maxWeightKg'],
    })
  })

  it('reports a record that did not exist before', () => {
    const current = recordsOf([{ reps: 10, weightKg: 20 }])

    expect(compareRecords({}, current).improved).toEqual(['maxWeightKg', 'maxVolumeKg', 'bestSet'])
  })

  it('stores but does not announce records of a first workout', () => {
    const current = recordsOf(bench.sets)

    expect(compareRecords(undefined, current)).toEqual({ merged: current, improved: [] })
  })
})
