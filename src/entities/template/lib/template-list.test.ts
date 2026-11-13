import { describe, expect, it } from 'vitest'

import type { ExerciseFacts } from './derive'
import { listTemplates, refKey } from './template-list'

const byId: Record<string, ExerciseFacts> = {
  squat: { kind: 'bodyweight', primaryMuscles: ['quadriceps'], equipment: 'body only' },
  press: { kind: 'strength', primaryMuscles: ['chest'], equipment: 'barbell' },
}

const entry = (exerciseId: string) => ({
  id: exerciseId,
  exerciseId,
  sets: 3,
  reps: 10,
  restSec: 60,
})

describe('listTemplates', () => {
  it("derives an own set's place from its equipment", () => {
    const own = [
      { id: 't1', name: 'Ноги', entries: [entry('squat')], copiedFrom: null },
      { id: 't2', name: 'Грудь', entries: [entry('press')] },
    ]

    expect(listTemplates('own', own, byId, [])).toEqual([
      { ref: { source: 'own', id: 't1' }, name: 'Ноги', entries: [entry('squat')], place: 'home' },
      { ref: { source: 'own', id: 't2' }, name: 'Грудь', entries: [entry('press')], place: 'gym' },
    ])
  })

  it("keeps a ready-made set's declared place even when its equipment would derive another", () => {
    const ready = [{ id: 't2', name: 'Грудь', entries: [entry('press')], place: 'home' as const }]

    expect(listTemplates('ready', ready, byId, ['barbell'])).toEqual([
      {
        ref: { source: 'ready', id: 't2' },
        name: 'Грудь',
        entries: [entry('press')],
        place: 'home',
      },
    ])
  })

  it('keeps a list that has not loaded undefined', () => {
    expect(listTemplates('own', undefined, byId, [])).toBeUndefined()
  })
})

describe('refKey', () => {
  it('tells own and ready sets with the same id apart', () => {
    expect(refKey({ source: 'own', id: 'a' })).not.toBe(refKey({ source: 'ready', id: 'a' }))
  })
})
