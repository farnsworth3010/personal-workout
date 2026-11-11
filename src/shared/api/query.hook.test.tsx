import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createQueryClient, useSnapshotQuery, type SnapshotSource } from './query'

describe('useSnapshotQuery', () => {
  it('renders each snapshot, and after a remount the latest one without a stale frame', async () => {
    let push: (value: string) => void = () => undefined
    const unsubscribe = vi.fn()
    const source: SnapshotSource<string> = (next) => {
      push = next
      return unsubscribe
    }
    const seen: string[] = []

    function Name() {
      const { data, status } = useSnapshotQuery(['name'], source)
      seen.push(data ?? status)
      return <p>{data ?? status}</p>
    }

    const client = createQueryClient()
    const view = () => (
      <QueryClientProvider client={client}>
        <Name />
      </QueryClientProvider>
    )
    const { unmount } = render(view())
    expect(screen.getByText('pending')).toBeInTheDocument()

    act(() => push('Ann'))
    expect(await screen.findByText('Ann')).toBeInTheDocument()

    // A change while the screen is away (Today during a workout) still reaches the cache.
    unmount()
    act(() => push('Bob'))
    seen.length = 0
    render(view())

    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(seen).not.toContain('Ann')
    expect(unsubscribe).not.toHaveBeenCalled()

    act(() => {
      client.removeQueries({ queryKey: ['name'] })
    })
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
