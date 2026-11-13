import { describe, expect, it } from 'vitest'

import { muscleSchema } from '@/shared/api'

import { figure, offFigureMuscles } from './shapes'

describe('figure shapes', () => {
  it('draws every catalog muscle or lists it as off the figure, eyes aside', () => {
    const drawn = new Set([...Object.keys(figure.front), ...Object.keys(figure.back)])
    const body = muscleSchema.options.filter((m) => m !== 'eyes')

    expect(offFigureMuscles.filter((m) => drawn.has(m))).toEqual([])
    expect([...drawn, ...offFigureMuscles].sort()).toEqual([...body].sort())
  })
})
