import { describe, expect, it } from 'vitest'

import type { Exercise } from '@/entities/exercise'
import type { ListedTemplate } from '@/entities/template'

import type { Week } from '../model/types'
import { setFocus, setMeta, weekRange } from './format'

const exercise = (id: string, primaryMuscles: Exercise['primaryMuscles']): Exercise => ({
  id,
  name: id,
  kind: 'strength',
  primaryMuscles,
  secondaryMuscles: [],
  equipment: 'barbell',
  instructions: [],
  images: [],
})

const byId = {
  Row: exercise('Row', ['middle back']),
  Deadlift: exercise('Deadlift', ['lower back', 'hamstrings']),
  Curl: exercise('Curl', ['biceps']),
}

const set: ListedTemplate = {
  ref: { source: 'own', id: 'back' },
  name: 'Спина',
  place: 'gym',
  entries: ['Row', 'Deadlift', 'Curl'].map((exerciseId) => ({
    id: exerciseId,
    exerciseId,
    sets: 3,
    reps: 10,
    restSec: 60,
  })),
}

const days = (first: Date) =>
  Array.from({ length: 7 }, (_, i) => ({
    date: new Date(first.getFullYear(), first.getMonth(), first.getDate() + i),
  })) as Week['days']

describe('set text', () => {
  it('names the place and the first three muscles', () => {
    expect(setFocus(set, byId)).toBe('Зал · середина спины, поясница, задняя поверхность бедра')
  })

  it('names the place, the exercise count and the time', () => {
    expect(setMeta(set, byId)).toBe('Зал · 3 упр. · ~18 мин')
  })
})

describe('weekRange', () => {
  it('names the month once inside one month', () => {
    expect(weekRange(days(new Date(2026, 10, 9)))).toBe('9–15 ноября')
  })

  it('names both months across a month end', () => {
    expect(weekRange(days(new Date(2026, 10, 30)))).toBe('30 ноября – 6 декабря')
  })
})
