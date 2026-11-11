import { describe, expect, it } from 'vitest'

import readyTemplates from '../../../../public/catalog/templates.json'
import { gymOnlyCount, usesDuration } from '../lib/derive'
import { exercisesFixture } from '../lib/exercises.fixture'
import type { ReadyTemplate } from '../model/types'

const templates: ReadyTemplate[] = readyTemplates as ReadyTemplate[]

describe('public/catalog/templates.json', () => {
  it('has unique ids and pairs of one home and one gym set', () => {
    expect(new Set(templates.map((t) => t.id)).size).toBe(templates.length)

    const pairIds = new Set(templates.map((t) => t.pairId).filter(Boolean))

    for (const pairId of pairIds) {
      const places = templates.filter((t) => t.pairId === pairId).map((t) => t.place)

      expect(places.sort(), pairId).toEqual(['gym', 'home'])
    }
  })

  it.each(['warm-up', 'back-care'])('%s needs no equipment', (id) => {
    const template = templates.find((t) => t.id === id)

    expect(template?.place).toBe('home')
    expect(template && gymOnlyCount(template, exercisesFixture, [])).toBe(0)
  })

  it.each(templates.map((t) => [t.id, t] as const))('%s uses valid catalog entries', (_, t) => {
    expect(t.entries.length).toBeGreaterThanOrEqual(6)
    expect(t.entries.length).toBeLessThanOrEqual(9)

    for (const entry of t.entries) {
      const exercise = exercisesFixture[entry.exerciseId]

      expect(exercise, entry.exerciseId).toBeDefined()
      expect(entry.sets).toBeGreaterThanOrEqual(1)

      const field = usesDuration(exercise.kind) ? 'durationSec' : 'reps'

      expect(Object.keys(entry).sort(), entry.exerciseId).toEqual(
        ['exerciseId', 'sets', field, 'restSec'].sort(),
      )
    }
  })
})
