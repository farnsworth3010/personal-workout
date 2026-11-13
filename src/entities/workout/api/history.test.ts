import { orderBy, query, Timestamp, where } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'

import type { Workout } from '@/shared/api'

import { fullHistoryRange, historyQuery, lastBodyWeight } from './history'
import { workoutKeys } from './keys'

vi.mock('firebase/firestore', async (importOriginal) => {
  const real = await importOriginal<typeof import('firebase/firestore')>()

  return { ...real, query: vi.fn(), where: vi.fn(), orderBy: vi.fn() }
})

const week = { from: new Date(2026, 10, 9), to: new Date(2026, 10, 16) }

describe('workout history', () => {
  it('keys a range by its timestamps, so equal ranges share one listener', () => {
    const same = { from: new Date(week.from), to: new Date(week.to) }

    expect(workoutKeys.history('u1', same)).toEqual(workoutKeys.history('u1', week))
    expect(workoutKeys.history('u1', week)).not.toEqual(
      workoutKeys.history('u1', { ...week, to: new Date(2026, 10, 17) }),
    )
  })

  it('keeps list keys apart from single-workout keys', () => {
    expect(workoutKeys.recent('u1')).toEqual(['workouts', 'u1', 'recent'])
    expect(workoutKeys.active('u1')).not.toEqual(workoutKeys.one('u1', 'w1'))
  })

  it('takes the whole history up to the end of today, the same key all day', () => {
    const morning = fullHistoryRange(new Date(2026, 10, 13, 7, 5))
    const evening = fullHistoryRange(new Date(2026, 10, 13, 23, 59))

    expect(morning).toEqual({ from: new Date(0), to: new Date(2026, 10, 14) })
    expect(workoutKeys.history('u1', morning)).toEqual(workoutKeys.history('u1', evening))
  })

  it('queries startedAt in [from, to), newest first, with no composite index', () => {
    historyQuery('u1', week)

    expect(vi.mocked(where).mock.calls).toEqual([
      ['startedAt', '>=', Timestamp.fromDate(week.from)],
      ['startedAt', '<', Timestamp.fromDate(week.to)],
    ])
    expect(vi.mocked(orderBy)).toHaveBeenCalledWith('startedAt', 'desc')
    expect(vi.mocked(query).mock.calls[0]?.[0]).toMatchObject({ path: 'users/u1/workouts' })
  })
})

describe('lastBodyWeight', () => {
  const at = (day: number) => Timestamp.fromDate(new Date(2026, 10, day))
  const workout = (day: number, status: Workout['status'], bodyWeightKg?: number) =>
    ({ status, startedAt: at(day), survey: { bodyWeightKg } }) as unknown as Workout

  it('takes the newest finished workout that recorded a weight', () => {
    const newestFirst = [workout(12, 'active', 90), workout(11, 'done'), workout(10, 'done', 81.5)]

    expect(lastBodyWeight(newestFirst)).toEqual({ kg: 81.5, date: new Date(2026, 10, 10) })
  })

  it('returns null when no finished workout has one', () => {
    expect(lastBodyWeight([workout(11, 'done'), workout(12, 'active', 90)])).toBeNull()
    expect(lastBodyWeight([])).toBeNull()
  })
})
