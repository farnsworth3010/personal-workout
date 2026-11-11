import { describe, expect, it } from 'vitest'

import { fuzzyFilter, fuzzyScore, normalize, scoreWord } from './fuzzy'

describe('normalize', () => {
  it('lowercases, trims and treats ё as е', () => {
    expect(normalize('  Блочный ТренажЁр ')).toBe('блочный тренажер')
  })
})

describe('scoreWord', () => {
  it('matches letters in order with gaps, and nothing out of order', () => {
    expect(scoreWord('bnch', 'bench press')).not.toBeNull()
    expect(scoreWord('hcneb', 'bench press')).toBeNull()
    expect(scoreWord('x', 'bench press')).toBeNull()
  })

  it('prefers word starts and consecutive letters', () => {
    const start = scoreWord('pr', 'bench press') ?? 0
    const middle = scoreWord('pr', 'upright row') ?? 0
    const together = scoreWord('ben', 'bench') ?? 0
    const apart = scoreWord('ben', 'barbell knee') ?? 0

    expect(start).toBeGreaterThan(middle)
    expect(together).toBeGreaterThan(apart)
  })

  it('takes the best of several starting points', () => {
    // The second "p" starts a word, so it beats the "p" inside "upright".
    expect(scoreWord('pre', 'upright press')).toBe(scoreWord('pre', 'press'))
  })
})

describe('fuzzyScore', () => {
  it('needs every word, each in any one field', () => {
    const fields = ['Dumbbell Bench Press', 'грудь', 'Гантели']

    expect(fuzzyScore('bench гант', fields)).not.toBeNull()
    expect(fuzzyScore('bench штанга', fields)).toBeNull()
    expect(fuzzyScore('  ', fields)).toBe(0)
  })
})

describe('fuzzyFilter', () => {
  const names = ['Leg Press', 'Barbell Bench Press', 'Upright Row', 'Plank']

  it('drops non-matches and sorts by score, ties in the original order', () => {
    expect(fuzzyFilter(names, 'bp', (n) => [n])).toEqual(['Barbell Bench Press'])
    expect(fuzzyFilter(names, 'press', (n) => [n])).toEqual(['Leg Press', 'Barbell Bench Press'])
    expect(fuzzyFilter(names, 'pr', (n) => [n])).toEqual([
      'Leg Press',
      'Barbell Bench Press',
      'Upright Row',
    ])
  })

  it('keeps everything in order for an empty query', () => {
    expect(fuzzyFilter(names, '', (n) => [n])).toEqual(names)
  })
})
