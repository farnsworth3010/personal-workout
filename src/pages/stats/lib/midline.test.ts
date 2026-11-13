import { describe, expect, it } from 'vitest'

import { figure } from '../config/shapes'
import { midlineSpan } from './midline'

describe('midlineSpan', () => {
  const bridged = (view: 'front' | 'back') =>
    Object.entries(figure[view]).flatMap(([m, paths]) => (midlineSpan(paths) ? [m] : []))

  it('bridges the muscles whose halves meet at the midline, and not the legs', () => {
    expect(bridged('front')).toEqual(['chest', 'abdominals'])
    expect(bridged('back')).toEqual(['traps', 'lower back', 'glutes'])
    expect(midlineSpan(figure.front.chest ?? [])).toEqual([78, 121])
  })
})
