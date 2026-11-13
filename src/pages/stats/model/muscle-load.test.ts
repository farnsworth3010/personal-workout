import { describe, expect, it } from 'vitest'

import { loadLevel } from './muscle-load'

describe('loadLevel', () => {
  it.each([
    [0, 0],
    [0.5, 1],
    [9.5, 1],
    [10, 2],
    [20, 2],
    [20.5, 3],
    [30, 3],
  ])('%s sets → level %s', (sets, level) => {
    expect(loadLevel(sets)).toBe(level)
  })
})
