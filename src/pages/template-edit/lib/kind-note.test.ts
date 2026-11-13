import { describe, expect, it } from 'vitest'

import { kindNote } from './kind-note'

describe('kindNote', () => {
  it('shows the last weight for strength, a hint before the first workout', () => {
    expect(kindNote('strength', 62.5)).toBe('Силовое · в прошлый раз 62,5 кг')
    expect(kindNote('strength', 0)).toBe('Силовое · вес подставится после первой тренировки')
    expect(kindNote('cardio', 10)).toBe('Кардио')
  })
})
