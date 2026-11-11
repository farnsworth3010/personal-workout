import { describe, expect, it } from 'vitest'

import { deriveKind, toExercise, type RawExercise } from './derive.ts'

const raw: RawExercise = {
  id: 'Pullups',
  name: 'Pullups',
  category: 'strength',
  equipment: 'body only',
  primaryMuscles: ['lats'],
  secondaryMuscles: ['biceps'],
  instructions: ['Grab the bar.'],
  images: ['Pullups/0.jpg', 'Pullups/1.jpg'],
}

describe('deriveKind', () => {
  it('follows research R11', () => {
    expect(deriveKind('stretching', 'body only')).toBe('timed')
    expect(deriveKind('cardio', 'machine')).toBe('cardio')
    expect(deriveKind('strength', 'body only')).toBe('bodyweight')
    expect(deriveKind('plyometrics', 'pull-up bar')).toBe('bodyweight')
    expect(deriveKind('strength', 'barbell')).toBe('strength')
    expect(deriveKind('powerlifting', null)).toBe('strength')
  })
})

describe('toExercise', () => {
  it('keeps the dataset values without an override', () => {
    expect(toExercise(raw)).toEqual({
      id: 'Pullups',
      name: 'Pullups',
      kind: 'bodyweight',
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps'],
      equipment: 'body only',
      instructions: ['Grab the bar.'],
      images: ['Pullups/0.jpg', 'Pullups/1.jpg'],
    })
  })

  it('derives the kind from the overridden equipment', () => {
    const weighted = { ...raw, equipment: 'other' }

    expect(toExercise(weighted).kind).toBe('strength')
    expect(toExercise(weighted, { equipment: 'pull-up bar', reason: '' })).toMatchObject({
      equipment: 'pull-up bar',
      kind: 'bodyweight',
    })
  })

  it('lets an explicit kind win and an equipment override clear the value', () => {
    expect(toExercise(raw, { kind: 'timed', equipment: null, reason: '' })).toMatchObject({
      kind: 'timed',
      equipment: null,
    })
  })

  it('names photos by index', () => {
    expect(toExercise({ ...raw, images: ['Pullups/a.jpg'] }).images).toEqual(['Pullups/0.jpg'])
  })
})
