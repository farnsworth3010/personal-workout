import { describe, expect, it } from 'vitest'

import type { Exercise } from '@/entities/exercise'
import { defaultProfile } from '@/entities/profile'
import type { ListedTemplate } from '@/entities/template'

import { daysText, exercisesWord, musclesText, setSummary } from './format'

const exercise = (id: string, equipment: Exercise['equipment']): Exercise => ({
  id,
  name: id,
  kind: 'strength',
  primaryMuscles: ['chest', 'triceps'],
  secondaryMuscles: [],
  equipment,
  instructions: [],
  images: [],
})

const byId = { Pushups: exercise('Pushups', 'body only'), Bench: exercise('Bench', 'barbell') }
const entry = (exerciseId: string) => ({
  id: exerciseId,
  exerciseId,
  sets: 3,
  reps: 10,
  restSec: 60,
})
const set: ListedTemplate = {
  ref: { source: 'own', id: 'o1' },
  name: 'Грудь',
  place: 'gym',
  entries: [entry('Bench')],
}

describe('exercisesWord', () => {
  it('declines the noun by the Russian plural rule', () => {
    expect([1, 2, 5, 11, 21, 22, 112].map(exercisesWord)).toEqual([
      '1 упражнение',
      '2 упражнения',
      '5 упражнений',
      '11 упражнений',
      '21 упражнение',
      '22 упражнения',
      '112 упражнений',
    ])
  })
})

describe('musclesText', () => {
  it('capitalises only the first muscle', () => {
    expect(musclesText(set.entries, byId)).toBe('Грудь, трицепс')
  })
})

describe('daysText', () => {
  it('lists the weekdays that hold the set', () => {
    const schedule = { ...defaultProfile.schedule, mon: [set.ref], thu: [set.ref] }

    expect(daysText(set.ref, schedule)).toBe('по понедельникам, четвергам')
    expect(daysText({ source: 'ready', id: 'o1' }, schedule)).toBeNull()
    expect(daysText(set.ref, undefined)).toBeNull()
  })
})

describe('setSummary', () => {
  it('joins place, exercise count, time and muscles', () => {
    expect(setSummary(set, byId)).toBe('Зал · 1 упражнение · ~6 мин · Грудь, трицепс')
  })
})
