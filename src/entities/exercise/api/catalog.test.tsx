import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCatalogById } from './catalog'

const squat = {
  id: 'Bodyweight_Squat',
  name: 'Bodyweight Squat',
  kind: 'bodyweight',
  primaryMuscles: ['quadriceps'],
  secondaryMuscles: [],
  equipment: 'body only',
  images: [],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useCatalogById', () => {
  it('keys the catalog by id and keeps one object across renders', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json([squat]))),
    )
    const client = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result, rerender } = renderHook(() => useCatalogById(), { wrapper })
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
    const first = result.current.data
    rerender()

    expect(first?.Bodyweight_Squat).toMatchObject({ name: 'Bodyweight Squat', instructions: [] })
    expect(first?.Unknown).toBeUndefined()
    expect(result.current.data).toBe(first)
  })
})
