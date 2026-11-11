import { describe, expect, it } from 'vitest'

import readyTemplates from '../../../../public/catalog/templates.json'
import { gymOnlyCount, usesDuration } from '../lib/derive'
import { exercisesFixture } from '../lib/exercises.fixture'
import { readyTemplatesSchema } from './ready-templates'

const templates = readyTemplatesSchema.parse(readyTemplates)

describe('public/catalog/templates.json', () => {
  it('keeps the file entry ids and gives missing ones a position id, unique per set', () => {
    const [first] = readyTemplatesSchema.parse([
      {
        id: 't',
        name: 'T',
        place: 'home',
        entries: [
          { id: 't-1', exerciseId: 'A', sets: 1, reps: 5, restSec: 30 },
          { exerciseId: 'A', sets: 1, reps: 5, restSec: 30 },
        ],
      },
    ])

    expect(first.entries.map((e) => e.id)).toEqual(['t-1', 'e1'])

    for (const t of templates)
      expect(new Set(t.entries.map((e) => e.id)).size, t.id).toBe(t.entries.length)
  })

  it('matches the schema the app parses it with', () => {
    expect(readyTemplatesSchema.safeParse(readyTemplates).success).toBe(true)
    expect(
      readyTemplatesSchema.safeParse([{ id: 'x', name: 'X', place: 'park', entries: [] }]).success,
    ).toBe(false)
  })

  it('has unique ids and pairs of one home and one gym set', () => {
    expect(new Set(templates.map((t) => t.id)).size).toBe(templates.length)

    const pairIds = new Set(templates.map((t) => t.pairId).filter(Boolean))

    for (const pairId of pairIds) {
      const places = templates.filter((t) => t.pairId === pairId).map((t) => t.place)

      expect(places.sort(), pairId).toEqual(['gym', 'home'])
    }
  })

  // The back set may use a foam roll, which the owner counts as home equipment like a mat.
  it.each([
    ['warm-up', []],
    ['back-care', ['foam roll']],
  ] as const)('%s needs no equipment beyond %j', (id, allowed) => {
    const template = templates.find((t) => t.id === id)

    expect(template?.place).toBe('home')
    expect(template && gymOnlyCount(template, exercisesFixture, allowed)).toBe(0)
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
        ['id', 'exerciseId', 'sets', field, 'restSec'].sort(),
      )
    }
  })
})
