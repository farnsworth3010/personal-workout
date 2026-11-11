import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToday } from './use-today'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 11, 22, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToday', () => {
  it('keeps the same date within the day and renews it on return the next day', () => {
    const { result } = renderHook(() => useToday())
    const first = result.current

    act(() => {
      vi.setSystemTime(new Date(2026, 10, 11, 23, 0))
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current).toBe(first)

    act(() => {
      vi.setSystemTime(new Date(2026, 10, 12, 8, 0))
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.getDate()).toBe(12)
  })

  it('renews at midnight while the page stays open', () => {
    const { result } = renderHook(() => useToday())

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1000)
    })

    expect(result.current.getDate()).toBe(12)
  })
})
