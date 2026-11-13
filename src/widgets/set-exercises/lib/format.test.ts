import { describe, expect, it } from 'vitest'

import type { TemplateEntry } from '@/entities/template'

import { planLine } from './format'

describe('planLine', () => {
  it('shows sets by reps or by seconds', () => {
    expect(planLine({ sets: 3, reps: 10 } as TemplateEntry)).toBe('3 × 10')
    expect(planLine({ sets: 2, durationSec: 45 } as TemplateEntry)).toBe('2 × 45 с')
  })
})
