import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Workout } from '@/shared/api'

import { useAutosave } from './use-autosave'

const mocks = vi.hoisted(() => ({ saveActiveWorkout: vi.fn() }))

vi.mock('@/entities/workout', () => ({ saveActiveWorkout: mocks.saveActiveWorkout }))

type Saved = Parameters<typeof useAutosave>[1]

// Only the identity of the document matters to the hook.
const workout = (name: string) => ({ template: { name } }) as unknown as Workout

const render = (saved: Saved) =>
  renderHook((s: Saved) => useAutosave('u1', s), { initialProps: saved })

beforeEach(() => {
  mocks.saveActiveWorkout.mockClear()
})

describe('useAutosave', () => {
  it('writes every new version of the document once', () => {
    const first = workout('a')
    const { rerender } = render({ workoutId: 'w1', workout: first, finished: null })

    expect(mocks.saveActiveWorkout).toHaveBeenLastCalledWith('u1', 'w1', first)

    rerender({ workoutId: 'w1', workout: first, finished: null })
    expect(mocks.saveActiveWorkout).toHaveBeenCalledTimes(1)

    const second = workout('b')
    rerender({ workoutId: 'w1', workout: second, finished: null })
    expect(mocks.saveActiveWorkout).toHaveBeenLastCalledWith('u1', 'w1', second)
    expect(mocks.saveActiveWorkout).toHaveBeenCalledTimes(2)
  })

  it('does not write while finishing or without a workout', () => {
    const { rerender } = render({
      workoutId: 'w1',
      workout: workout('a'),
      finished: { workoutId: 'w1', workout: workout('a') },
    })

    rerender({ workoutId: null, workout: null, finished: null })

    expect(mocks.saveActiveWorkout).not.toHaveBeenCalled()
  })
})
