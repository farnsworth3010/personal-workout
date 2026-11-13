import { describe, expect, it } from 'vitest'

import { muscleGroupsText, muscleLine } from './muscles'

describe('muscleGroupsText', () => {
  it('lists the muscles in lower case', () => {
    expect(muscleGroupsText(['lats', 'lower back'])).toBe('широчайшие, поясница')
    expect(muscleGroupsText([])).toBe('')
  })

  it('keeps the first muscles and capitalises the first one on request', () => {
    expect(
      muscleGroupsText(['hamstrings', 'glutes', 'calves', 'quadriceps'], {
        limit: 3,
        capitalizeFirst: true,
      }),
    ).toBe('Задняя поверхность бедра, ягодицы, икры')
  })
})

describe('muscleLine', () => {
  it('joins primary and secondary muscles, skipping an empty group', () => {
    expect(
      muscleLine({ primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'] }),
    ).toBe('грудь · трицепс, плечи')
    expect(muscleLine({ primaryMuscles: ['abdominals'], secondaryMuscles: [] })).toBe('пресс')
    expect(muscleLine({ primaryMuscles: [], secondaryMuscles: [] })).toBe('')
  })
})
