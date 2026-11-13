import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMediaQuery } from './media-query'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMediaQuery', () => {
  it('reads the query and re-renders on change', () => {
    let matches = false
    const listeners = new Set<() => void>()
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return matches
      },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }))

    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 900px)'))
    expect(result.current).toBe(false)

    act(() => {
      matches = true
      listeners.forEach((listener) => {
        listener()
      })
    })
    expect(result.current).toBe(true)

    unmount()
    expect(listeners.size).toBe(0)
  })
})
