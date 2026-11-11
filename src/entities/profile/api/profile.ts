import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getDocFromServer, setDoc, Timestamp } from 'firebase/firestore'

import { docSource, fireWrite, profileRef, useSnapshotQuery, type Profile } from '@/shared/api'

import { defaultProfile, mergeProfile, withDefaults, type ProfilePatch } from '../model/profile'

export const profileQueryKey = (uid: string) => ['profile', uid] as const

// Writes the whole document: the converter rejects partial nested objects and updateDoc skips it.
export function updateProfile(client: QueryClient, uid: string, patch: ProfilePatch) {
  const key = profileQueryKey(uid)
  const current = client.getQueryData<Profile | null>(key)

  // Writing defaults over a document that has not arrived yet would erase it.
  if (current === undefined) throw new Error('Profile is not loaded yet')

  const next = mergeProfile(withDefaults(current), patch, Timestamp.now())

  // Set now so a second update before the snapshot arrives builds on this one.
  client.setQueryData(key, next)
  fireWrite(() => setDoc(profileRef(uid), next))
}

// Creates the profile with defaults on first sign-in. Only the server can say it is missing: offline,
// or with a stale cache, defaults could overwrite a profile made on another device, so nothing is written.
export function ensureProfile(uid: string): void {
  fireWrite(async () => {
    const snapshot = await getDocFromServer(profileRef(uid)).catch(() => undefined)

    if (snapshot && !snapshot.exists())
      await setDoc(profileRef(uid), { ...defaultProfile, updatedAt: Timestamp.now() })
  })
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
