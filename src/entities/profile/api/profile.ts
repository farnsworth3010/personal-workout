import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getDocFromServer, setDoc, Timestamp } from 'firebase/firestore'

import {
  docSource,
  fireWrite,
  profileRef,
  profileSchema,
  useSnapshotQuery,
  type Profile,
} from '@/shared/api'

import { defaultProfile, mergeProfile, withDefaults, type ProfilePatch } from '../model/profile'

export const profileQueryKey = (uid: string) => ['profile', uid] as const

// The server's profile gets only the edited top-level keys (merge), so edits made on another device to the
// rest survive; a profile the server says is missing is created whole. Validated before the cache, so a
// change the converter would reject is reported instead of showing until reload.
export function updateProfile(client: QueryClient, uid: string, patch: ProfilePatch) {
  const key = profileQueryKey(uid)
  const current = client.getQueryData<Profile | null>(key)

  // Writing defaults over a document that has not arrived yet would erase it.
  if (current === undefined) throw new Error('Profile is not loaded yet')

  const now = Timestamp.now()
  const parsed = profileSchema.safeParse(mergeProfile(withDefaults(current), patch, now))

  if (!parsed.success) {
    fireWrite(() => Promise.reject(parsed.error), 'profile')
    return
  }

  const next = parsed.data

  // Set now so a second update before the snapshot arrives builds on this one.
  client.setQueryData(key, next)

  if (current === null) {
    fireWrite(() => setDoc(profileRef(uid), next), 'profile')
    return
  }

  const edited = Object.fromEntries(
    Object.keys(patch).map((k) => [k, next[k as keyof Profile]]),
  ) as Partial<Profile>

  fireWrite(
    () => setDoc(profileRef(uid), { ...edited, updatedAt: now }, { merge: true }),
    'profile',
  )
}

// Creates the profile with defaults on first sign-in. Only the server can say it is missing: offline,
// or with a stale cache, defaults could overwrite a profile made on another device, so nothing is written.
export function ensureProfile(uid: string): void {
  fireWrite(async () => {
    const snapshot = await getDocFromServer(profileRef(uid)).catch(() => undefined)

    if (snapshot && !snapshot.exists())
      await setDoc(profileRef(uid), { ...defaultProfile, updatedAt: Timestamp.now() })
  }, 'profile')
}

export function useProfile(uid: string) {
  const client = useQueryClient()
  const query = useSnapshotQuery(profileQueryKey(uid), docSource(profileRef(uid)))

  return {
    profile: query.isSuccess ? withDefaults(query.data) : undefined,
    isPending: query.isPending,
    error: query.error,
    update: (patch: ProfilePatch) => {
      updateProfile(client, uid, patch)
    },
  }
}
