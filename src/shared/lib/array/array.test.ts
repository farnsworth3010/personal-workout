import { describe, expect, it } from 'vitest'

import { move } from './array'

describe('move', () => {
  it('swaps the item with its neighbour in a new array', () => {
    const list = ['a', 'b', 'c']

    expect(move(list, 0, 1)).toEqual(['b', 'a', 'c'])
    expect(move(list, 2, -1)).toEqual(['a', 'c', 'b'])
    expect(list).toEqual(['a', 'b', 'c'])
  })

  it('returns the same array for a move past either end', () => {
    const list = ['a', 'b']

    expect(move(list, 0, -1)).toBe(list)
    expect(move(list, 1, 1)).toBe(list)
  })
})
