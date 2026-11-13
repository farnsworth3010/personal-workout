import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import type { Exercise } from '@/entities/exercise'

import { useCatalogView } from './use-catalog-view'

const mocks = vi.hoisted(() => ({ useCatalog: vi.fn() }))

vi.mock('@/entities/exercise', async (original) => ({
  ...(await original<typeof import('@/entities/exercise')>()),
  useCatalog: mocks.useCatalog,
}))
vi.mock('@/entities/profile', () => ({
  useProfile: () => ({ profile: { homeEquipment: [] } }),
}))

const exercise = (n: number): Exercise => ({
  id: `Ex_${n}`,
  name: `Ex ${n}`,
  kind: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'dumbbell',
  instructions: [],
  images: [],
})

function renderView(size: number) {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  mocks.useCatalog.mockReturnValue({ data: Array.from({ length: size }, (_, n) => exercise(n)) })

  return renderHook(() => useCatalogView('u1'), {
    wrapper: ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>,
  }).result
}

describe('useCatalogView paging', () => {
  it('shows the list in pages of 60 and starts over when the filter changes', () => {
    const view = renderView(130)

    expect(view.current.count).toBe(60)

    act(() => view.current.showMore())
    act(() => view.current.showMore())
    expect(view.current.count).toBe(180)
    expect(view.current.visible).toHaveLength(130)

    act(() => view.current.update({ equipment: 'dumbbell' }))
    expect(view.current.count).toBe(60)
  })
})
