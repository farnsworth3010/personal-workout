import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { runTransaction, setDoc, Timestamp } from 'firebase/firestore'

import {
  db,
  docSource,
  fireWrite,
  profileRef,
  profileSchema,
  useSnapshotQuery,
  type Profile,
} from '@/shared/api'
import { toast } from '@/shared/ui'

import { defaultProfile, mergeProfile, withDefaults, type ProfilePatch } from '../model/profile'

export const profileQueryKey = (uid: string) => ['profile', uid] as const

// 'not-loaded': the screens show defaults because the server has not answered, so nothing was written.
type ProfileUpdate = 'queued' | 'not-loaded'

// The server's profile gets only the edited top-level keys (merge), so edits made on another device to the
// rest survive; a profile the server says is missing is created whole. Validated before the cache, so a
// change the converter would reject is reported instead of showing until reload.
export function updateProfile(
  client: QueryClient,
  uid: string,
  patch: ProfilePatch,
): ProfileUpdate {
  const key = profileQueryKey(uid)
  const current = client.getQueryData<Profile | null>(key)

  // Writing defaults over a document that has not arrived yet would erase it.
  if (current === undefined) throw new Error('Profile is not loaded yet')

  // Shown as defaults while the server has not answered: an edit now could only guess the real document.
  if (current === defaultProfile) return 'not-loaded'

  const now = Timestamp.now()
  const parsed = profileSchema.safeParse(mergeProfile(withDefaults(current), patch, now))

  // Reported through the write error listeners, like a rejected write.
  if (!parsed.success) {
    fireWrite(() => Promise.reject(parsed.error), 'profile')
    return 'queued'
  }

  const next = parsed.data

  // Set now so a second update before the snapshot arrives builds on this one.
  client.setQueryData(key, next)

  if (current === null) {
    fireWrite(() => setDoc(profileRef(uid), next), 'profile')
    return 'queued'
  }

  const edited = Object.fromEntries(
    Object.keys(patch).map((k) => [k, next[k as keyof Profile]]),
  ) as Partial<Profile>

  fireWrite(
    () => setDoc(profileRef(uid), { ...edited, updatedAt: now }, { merge: true }),
    'profile',
  )

  return 'queued'
}

// Creates the profile with defaults on first sign-in. Only the server can say it is missing: offline,
// or with a stale cache, defaults could overwrite a profile made on another device, so nothing is
// written. A transaction, so a write landing between the read and this one (another device's first
// sign-in, a seed in tests) is caught: Firestore retries the read, finds the profile already there
// and skips the write, instead of the two racing and whichever lands last winning.
export function ensureProfile(uid: string): void {
  fireWrite(async () => {
    try {
      await runTransaction(db, async (tx) => {
        const snapshot = await tx.get(profileRef(uid))

        if (!snapshot.exists())
          tx.set(profileRef(uid), { ...defaultProfile, updatedAt: Timestamp.now() })
      })
    } catch (error) {
      // By code: SDK errors are not reliably instances of the exported FirestoreError class.
      // Offline is expected and silent; anything else (e.g. permission-denied) is a real failure.
      if ((error as { code?: unknown } | null)?.code !== 'unavailable') throw error
    }
  }, 'profile')
}

export function useProfile(uid: string) {
  const client = useQueryClient()
  // Without a server answer the screens get the defaults (by reference, so updateProfile can tell).
  const query = useSnapshotQuery(profileQueryKey(uid), docSource(profileRef(uid), defaultProfile))

  return {
    profile: query.isSuccess ? withDefaults(query.data) : undefined,
    isPending: query.isPending,
    error: query.error,
    update: (patch: ProfilePatch) => {
      if (updateProfile(client, uid, patch) === 'not-loaded')
        toast('Профиль ещё не загрузился с сервера. Повторите, когда появится связь.')
    },
  }
}
