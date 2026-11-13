import { describe, expect, it } from 'vitest'

import { emptyText, exercisesWord, homeHint } from './format'

describe('exercisesWord', () => {
  it('takes the Russian plural form', () => {
    expect([1, 3, 5, 11, 21, 873].map(exercisesWord)).toEqual([
      '1 упражнение',
      '3 упражнения',
      '5 упражнений',
      '11 упражнений',
      '21 упражнение',
      '873 упражнения',
    ])
  })
})

describe('homeHint', () => {
  it('lists the home equipment with body weight last, capitalised', () => {
    expect(homeHint([])).toBe('Свой вес — из профиля')
    expect(homeHint(['body only', 'dumbbell'])).toMatch(/^[А-Я][^А-Я]* и свой вес — из профиля$/)
  })
})

describe('emptyText', () => {
  it('names only the active filters', () => {
    expect(emptyText({ q: 'жим', group: null, equipment: null, homeOnly: true })).toBe(
      'по запросу «жим», для дома',
    )
    expect(emptyText({ q: '', group: null, equipment: null, homeOnly: false })).toBe('')
  })
})
