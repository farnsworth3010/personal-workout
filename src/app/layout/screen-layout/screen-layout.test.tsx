import { act, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScreenLayout } from './screen-layout'

describe('ScreenLayout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the old page for 120ms, then the target route skeleton until it loads', async () => {
    let resolveStats: (Component: ComponentType) => void
    const statsReady = new Promise<ComponentType>((resolve) => {
      resolveStats = resolve
    })
    const router = createMemoryRouter(
      [
        {
          Component: ScreenLayout,
          children: [
            { index: true, element: <p>today page</p> },
            { path: 'stats', lazy: { Component: () => statsReady } },
          ],
        },
      ],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('today page')).toBeInTheDocument()

    act(() => {
      void router.navigate('/stats')
    })

    // Still under the 120ms grace window: the old page stays, no skeleton flash.
    expect(screen.getByText('today page')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(120)
    })

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(screen.queryByText('today page')).not.toBeInTheDocument()

    // The lazy module settles on real timers; findByText below polls for the commit.
    vi.useRealTimers()
    await act(async () => {
      resolveStats(() => <p>stats page</p>)
      await statsReady
    })

    expect(await screen.findByText('stats page')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
  })

  it('shows no skeleton when only the search params change on the same path', async () => {
    const router = createMemoryRouter(
      [{ Component: ScreenLayout, children: [{ path: 'stats', element: <p>stats page</p> }] }],
      { initialEntries: ['/stats'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('stats page')).toBeInTheDocument()

    await act(async () => {
      await router.navigate('/stats?x=1')
    })

    expect(screen.getByText('stats page')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
  })
})
