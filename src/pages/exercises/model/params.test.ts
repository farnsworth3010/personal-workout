import { describe, expect, it } from 'vitest'

import { readParams, writeParams } from './params'

const read = (search: string) => readParams(new URLSearchParams(search))

describe('readParams', () => {
  it('reads search, group, equipment and the home flag', () => {
    expect(read('?q=press&muscle=chest&equipment=pull-up+bar&home')).toEqual({
      q: 'press',
      group: 'chest',
      equipment: 'pull-up bar',
      homeOnly: true,
    })
  })

  it('drops unknown values and treats missing ones as no filter', () => {
    expect(read('?muscle=toString&equipment=rope')).toEqual({
      q: '',
      group: null,
      equipment: null,
      homeOnly: false,
    })
  })
})

describe('writeParams', () => {
  it('writes only the active filters and round-trips', () => {
    const params = { q: 'жим', group: 'legs', equipment: 'dumbbell', homeOnly: true } as const

    expect(readParams(writeParams(params))).toEqual(params)
    expect(writeParams({ q: '', group: null, equipment: null, homeOnly: false }).toString()).toBe(
      '',
    )
  })
})
