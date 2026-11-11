import { describe, expect, it } from 'vitest'

import { setText, tagsText } from './format'

describe('setText', () => {
  it('formats weight, reps and duration sets', () => {
    expect(setText({ reps: 10, weightKg: 62.5 })).toBe('10 × 62,5')
    expect(setText({ reps: 10, weightKg: 60 }, true)).toBe('10 × 60 кг')
    expect(setText({ reps: 12 })).toBe('12')
    expect(setText({ reps: 12, weightKg: 0 })).toBe('12')
    expect(setText({ durationSec: 45 })).toBe('45 с')
  })
})

describe('tagsText', () => {
  it('lists primary, secondary muscles and equipment', () => {
    const exercise = {
      id: 'Bench',
      name: 'Bench',
      kind: 'strength' as const,
      primaryMuscles: ['chest' as const],
      secondaryMuscles: ['triceps' as const, 'shoulders' as const],
      equipment: 'barbell' as const,
      instructions: [],
      images: [],
    }

    expect(tagsText(exercise)).toBe('Грудь · трицепс, плечи · штанга')
    expect(tagsText({ ...exercise, secondaryMuscles: [], equipment: null })).toBe('Грудь')
  })
})
