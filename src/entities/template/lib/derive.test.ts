import { describe, expect, it } from 'vitest'

import {
  estimateDurationMin,
  type ExerciseFacts,
  gymOnlyCount,
  muscleGroupsOf,
  needsGym,
  placeOf,
} from './derive'

const exercises: Record<string, ExerciseFacts> = {
  squat: { kind: 'bodyweight', primaryMuscles: ['quadriceps'], equipment: 'body only' },
  stretch: { kind: 'timed', primaryMuscles: ['hamstrings'], equipment: null },
  curl: { kind: 'strength', primaryMuscles: ['biceps'], equipment: 'dumbbell' },
  chin: { kind: 'bodyweight', primaryMuscles: ['lats', 'biceps'], equipment: 'pull-up bar' },
  press: { kind: 'strength', primaryMuscles: ['chest'], equipment: 'barbell' },
}

const template = {
  entries: [
    { exerciseId: 'squat', sets: 3, reps: 15, restSec: 60 },
    { exerciseId: 'chin', sets: 3, reps: 6, restSec: 120 },
    { exerciseId: 'curl', sets: 2, reps: 12, restSec: 60 },
    { exerciseId: 'stretch', sets: 2, durationSec: 30, restSec: 10 },
  ],
}

describe('needsGym', () => {
  it('treats body weight and no equipment as available everywhere', () => {
    expect(needsGym(exercises.squat, [])).toBe(false)
    expect(needsGym(exercises.stretch, [])).toBe(false)
  })

  it('checks other equipment against the home list', () => {
    expect(needsGym(exercises.curl, [])).toBe(true)
    expect(needsGym(exercises.curl, ['dumbbell'])).toBe(false)
  })
})

describe('placeOf and gymOnlyCount', () => {
  it('is gym while any exercise needs missing equipment', () => {
    expect(gymOnlyCount(template, exercises, [])).toBe(2)
    expect(placeOf(template, exercises, [])).toBe('gym')
    expect(gymOnlyCount(template, exercises, ['dumbbell'])).toBe(1)
  })

  it('is home when the home equipment covers every exercise', () => {
    expect(gymOnlyCount(template, exercises, ['dumbbell', 'pull-up bar'])).toBe(0)
    expect(placeOf(template, exercises, ['dumbbell', 'pull-up bar'])).toBe('home')
  })

  it('ignores exercises missing from the catalog', () => {
    const unknown = { entries: [{ exerciseId: 'gone', sets: 1, reps: 1, restSec: 0 }] }

    expect(placeOf(unknown, exercises, [])).toBe('home')
  })
})

describe('estimateDurationMin', () => {
  it('sums sets × (work + rest) plus a minute per exercise', () => {
    // 3×(60+60) + 3×(24+120) + 2×(48+60) + 2×(30+10) + 4×60 = 1328 s
    expect(estimateDurationMin(template, exercises)).toBe(22)
  })

  it('picks the work field by exercise kind', () => {
    const both = {
      entries: [{ exerciseId: 'press', sets: 1, reps: 10, durationSec: 600, restSec: 0 }],
    }

    expect(estimateDurationMin(both, exercises)).toBe(2)
  })

  it('falls back to the entry fields for an unknown exercise', () => {
    const unknown = { entries: [{ exerciseId: 'gone', sets: 2, durationSec: 120, restSec: 0 }] }

    expect(estimateDurationMin(unknown, exercises)).toBe(5)
  })
})

describe('muscleGroupsOf', () => {
  it('returns unique primary muscles in entry order', () => {
    expect(muscleGroupsOf(template, exercises)).toEqual([
      'quadriceps',
      'lats',
      'biceps',
      'hamstrings',
    ])
  })
})
