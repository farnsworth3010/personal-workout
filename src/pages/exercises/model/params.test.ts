import { describe, expect, it } from 'vitest'

import { readParams, writeParams } from './params'

const read = (search: string) => readParams(new URLSearchParams(search))

describe('readParams', () => {
  it('reads search, group, equipment and the home flag', () => {
    expect(read('?q=press&muscle=chest&equipment=pull-up+bar&home')).toEqual({
      q: 'press',
      muscle: 'chest',
      equipment: 'pull-up bar',
      home: true,
    })
  })

  it('drops unknown values and treats missing ones as no filter', () => {
    expect(read('?muscle=toString&equipment=rope')).toEqual({
      q: '',
      muscle: null,
      equipment: null,
      home: false,
    })
  })
})

describe('writeParams', () => {
  it('writes only the active filters and round-trips', () => {
    const params = { q: 'жим', muscle: 'legs', equipment: 'dumbbell', home: true } as const

    expect(readParams(writeParams(params))).toEqual(params)
    expect(writeParams({ q: '', muscle: null, equipment: null, home: false }).toString()).toBe('')
  })
})
