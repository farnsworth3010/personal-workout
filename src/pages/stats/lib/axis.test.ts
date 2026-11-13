import { describe, expect, it } from 'vitest'

import { niceStep, rowsOf, yAxis } from './axis'

describe('niceStep', () => {
  it.each([
    [30, 10],
    [20, 10],
    [10, 5],
    [7, 2.5],
    [6, 2],
    [1, 0.5],
  ])('span %s → step %s', (span, step) => {
    expect(niceStep(span)).toBe(step)
  })
})

describe('yAxis', () => {
  it('rounds the data range out to whole steps', () => {
    expect(yAxis([62, 70])).toEqual([60, 70, 5])
    expect(yAxis([0, 100])).toEqual([0, 100, 50])
  })

  it('opens one step above a single value', () => {
    expect(yAxis([80, 80])).toEqual([80, 80.5, 0.5])
  })
})

describe('rowsOf', () => {
  it('merges series into one row per date, sorted by time', () => {
    const d = (day: number) => new Date(2026, 10, day)

    expect(
      rowsOf([
        {
          label: 'a',
          tone: 'primary',
          points: [
            { date: d(3), value: 1 },
            { date: d(1), value: 2 },
          ],
        },
        { label: 'b', tone: 'foreground', points: [{ date: d(3), value: 5 }] },
      ]),
    ).toEqual([
      { t: d(1).getTime(), s0: 2 },
      { t: d(3).getTime(), s0: 1, s1: 5 },
    ])
  })
})
