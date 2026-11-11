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

  it('turns a non-Error listener failure into an Error', () => {
    const client = createQueryClient()
    const { source, listeners } = fakeSource<number>()

    subscribeQuery(client, ['n'], source)
    listeners[0]?.error('permission-denied')

    expect(stateOf(client, ['n'])?.error).toEqual(new Error('permission-denied'))
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
  const meta = { fromCache: false, hasPendingWrites: false }
  const snap = (data: () => number | undefined, metadata = meta) => ({
    data,
    exists: () => data() !== undefined,
    metadata,
  })

  const listen = (next = vi.fn(), error = vi.fn()) => {
    docSource(ref)(next, error)
    const [, options, onNext] = onSnapshot.mock.lastCall as [unknown, unknown, (s: unknown) => void]

    expect(options).toEqual({ includeMetadataChanges: true })

    return onNext
  }

  it('passes the document data, or null for a document the server says is missing', () => {
    const next = vi.fn()
    const onNext = listen(next)

    onNext(snap(() => 5))
    onNext(snap(() => undefined))

    expect(next.mock.calls).toEqual([[5], [null]])
  })

  it('keeps a document missing only from the cache loading until the server answers', () => {
    const next = vi.fn()
    const onNext = listen(next)

    onNext(snap(() => undefined, { fromCache: true, hasPendingWrites: false }))
    expect(next).not.toHaveBeenCalled()

    onNext(snap(() => undefined, { fromCache: true, hasPendingWrites: true }))
    onNext(snap(() => 5, { fromCache: true, hasPendingWrites: false }))
    expect(next.mock.calls).toEqual([[null], [5]])
  })

  it('routes a converter failure to the error callback', () => {
    const error = vi.fn()
    const invalid = new Error('invalid document')
    const onNext = listen(vi.fn(), error)

    onNext({
      data: () => {
        throw invalid
      },
      exists: () => true,
      metadata: meta,
    })

    expect(error).toHaveBeenCalledWith(invalid)
  })
})
