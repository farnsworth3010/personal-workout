import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { setsLine } from './format'

const at = Timestamp.fromMillis(0)
const sets = (...list: { reps?: number; weightKg?: number; durationSec?: number }[]) => ({
  sets: list.map((s, i) => ({ n: i + 1, at, ...s })),
})

describe('format', () => {
  it('summarises the sets of an entry', () => {
    expect(setsLine(sets())).toBeNull()
    expect(setsLine(sets(...Array.from({ length: 4 }, () => ({ reps: 12, weightKg: 140 }))))).toBe(
      '4 × 12 · 140 кг',
    )
    expect(
      setsLine(
        sets({ reps: 10, weightKg: 60 }, { reps: 8, weightKg: 62.5 }, { reps: 8, weightKg: 62.5 }),
      ),
    ).toBe('3 подхода · 60–62,5 кг')
    expect(
      setsLine(sets({ reps: 15 }, { reps: 12 }, { reps: 10 }, { reps: 10 }, { reps: 9 })),
    ).toBe('5 подходов')
    expect(setsLine(sets({ durationSec: 45 }, { durationSec: 45 }))).toBe('2 × 45 с')
  })
})
