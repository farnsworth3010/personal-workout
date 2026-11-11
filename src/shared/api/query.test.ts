import type { QueryClient } from '@tanstack/react-query'
import type { DocumentReference } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'

import { createQueryClient, docSource, subscribeQuery, type SnapshotSource } from './query'

const onSnapshot = vi.hoisted(() => vi.fn())
vi.mock('firebase/firestore', () => ({ onSnapshot }))

function fakeSource<T>() {
  const listeners: { next: (data: T) => void; error: (error: unknown) => void }[] = []
  const unsubscribe = vi.fn()
  const source: SnapshotSource<T> = (next, error) => {
    listeners.push({ next, error })
    return unsubscribe
  }

  return { source, listeners, unsubscribe }
}

const stateOf = (client: QueryClient, key: string[]) =>
  client.getQueryCache().find({ queryKey: key })?.state

describe('createQueryClient', () => {
  it('applies the research R2 defaults', () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions()

    expect(queries).toMatchObject({
      networkMode: 'always',
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
    })
    expect(mutations).toMatchObject({ networkMode: 'always', retry: false })
  })
})

describe('subscribeQuery', () => {
  it('pushes every snapshot into the cache', () => {
    const client = createQueryClient()
    const { source, listeners } = fakeSource<number>()

    subscribeQuery(client, ['n'], source)
    listeners[0]?.next(1)
    expect(client.getQueryData(['n'])).toBe(1)

    listeners[0]?.next(2)
    expect(client.getQueryData(['n'])).toBe(2)
  })

  it('opens one listener per key and closes it when the query leaves the cache', () => {
    const client = createQueryClient()
    const { source, listeners, unsubscribe } = fakeSource<number>()

    subscribeQuery(client, ['n'], source)
    subscribeQuery(client, ['n'], source)
    expect(listeners).toHaveLength(1)

    client.removeQueries({ queryKey: ['n'] })
    expect(unsubscribe).toHaveBeenCalledOnce()

    subscribeQuery(client, ['n'], source)
    expect(listeners).toHaveLength(2)
  })

  it('schedules garbage collection even before anything renders the query', async () => {
    const client = createQueryClient()
    client.setQueryDefaults(['n'], { gcTime: 10 })
    const { source, unsubscribe } = fakeSource<number>()

    subscribeQuery(client, ['n'], source)
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('keeps keys and clients apart', () => {
    const client = createQueryClient()
    const { source, listeners } = fakeSource<number>()

    subscribeQuery(client, ['a'], source)
    subscribeQuery(client, ['b'], source)
    subscribeQuery(createQueryClient(), ['a'], source)

    expect(listeners).toHaveLength(3)
  })

  it('puts a listener error into the query state', async () => {
    const client = createQueryClient()
    const { source, listeners } = fakeSource<number>()
    const error = new Error('permission-denied')

    subscribeQuery(client, ['n'], source)
    listeners[0]?.error(error)

    expect(stateOf(client, ['n'])).toMatchObject({ status: 'error', error, fetchStatus: 'idle' })

    // A failed listener is closed, so the next subscriber opens a new one.
    await Promise.resolve()
    subscribeQuery(client, ['n'], source)
    expect(listeners).toHaveLength(2)
  })
})

describe('docSource', () => {
  const ref = {} as DocumentReference<number>

  it('passes the document data, or null for a missing document', () => {
    const next = vi.fn()
    docSource(ref)(next, vi.fn())
    const [, onNext] = onSnapshot.mock.lastCall as [unknown, (s: unknown) => void]

    onNext({ data: () => 5 })
    onNext({ data: () => undefined })

    expect(next.mock.calls).toEqual([[5], [null]])
  })

  it('routes a converter failure to the error callback', () => {
    const error = vi.fn()
    const invalid = new Error('invalid document')
    docSource(ref)(vi.fn(), error)
    const [, onNext] = onSnapshot.mock.lastCall as [unknown, (s: unknown) => void]

    onNext({
      data: () => {
        throw invalid
      },
    })

    expect(error).toHaveBeenCalledWith(invalid)
  })
})
