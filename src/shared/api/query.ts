import {
  hashKey,
  QueryClient,
  skipToken,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import {
  onSnapshot,
  type DocumentReference,
  type Query,
  type Unsubscribe,
} from 'firebase/firestore'
import { useEffect } from 'react'

export type SnapshotSource<T> = (
  next: (data: T) => void,
  error: (error: unknown) => void,
) => Unsubscribe

export type WithId<T> = T & { id: string }

// Research R2: Firestore owns freshness and offline, so the query cache never refetches.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always',
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: { networkMode: 'always', retry: false },
    },
  })
}

const subscriptions = new WeakMap<QueryClient, Map<string, Unsubscribe>>()

// One listener per key, open as long as the query is cached rather than rendered: cached data is
// never a frozen snapshot, and a screen shown again within gcTime has it at once, without a flash.
// The listener closes when the query is garbage-collected or the listener fails.
export function subscribeQuery<T>(
  client: QueryClient,
  queryKey: QueryKey,
  source: SnapshotSource<T>,
): void {
  const hash = hashKey(queryKey)
  let byKey = subscriptions.get(client)
  if (!byKey) {
    byKey = new Map()
    subscriptions.set(client, byKey)
  }

  if (byKey.has(hash)) return

  const cache = client.getQueryCache()
  // Builds the query now, so its garbage collection (which closes the listener) is scheduled.
  cache.build(client, { queryKey })

  const close = () => {
    if (byKey.get(hash) !== close) return
    byKey.delete(hash)
    stopWatching()
    unsubscribe()
  }
  const stopWatching = cache.subscribe((event) => {
    if (event.type === 'removed' && event.query.queryHash === hash) close()
  })
  byKey.set(hash, close)

  const unsubscribe = source(
    (data) => client.setQueryData(queryKey, data),
    (error) => {
      cache
        .build(client, { queryKey })
        .setState({ status: 'error', error: error as Error, fetchStatus: 'idle' })
      // After source() has returned its unsubscribe, even if it reports synchronously.
      queueMicrotask(close)
    },
  )
}

// The key identifies the source, so a new source function with the same key does not resubscribe.
export function useSnapshotQuery<T>(queryKey: QueryKey, source: SnapshotSource<T>) {
  const client = useQueryClient()
  const hash = hashKey(queryKey)

  useEffect(() => {
    subscribeQuery(client, queryKey, source)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, hash])

  return useQuery<T>({ queryKey, queryFn: skipToken })
}

// A converter that rejects a document reports through `error` instead of throwing in the listener.
export const docSource =
  <T>(ref: DocumentReference<T>): SnapshotSource<T | null> =>
  (next, error) =>
    onSnapshot(
      ref,
      (snapshot) => {
        try {
          next(snapshot.data() ?? null)
        } catch (e) {
          error(e)
        }
      },
      error,
    )

export const querySource =
  <T>(query: Query<T>): SnapshotSource<WithId<T>[]> =>
  (next, error) =>
    onSnapshot(
      query,
      (snapshot) => {
        try {
          next(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })))
        } catch (e) {
          error(e)
        }
      },
      error,
    )
