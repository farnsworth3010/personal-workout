import {
  runTransaction,
  setDoc,
  type DocumentReference,
  type Transaction,
} from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryClient, onWriteError, type Profile } from '@/shared/api'

import { defaultProfile } from '../model/profile'
import { ensureProfile, profileQueryKey, updateProfile } from './profile'

vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  setDoc: vi.fn(() => new Promise<void>(() => undefined)),
  runTransaction: vi.fn(),
}))

const toast = vi.hoisted(() => vi.fn())
vi.mock('@/shared/ui', () => ({ toast }))

const uid = 'user-1'

describe('updateProfile', () => {
  beforeEach(() => {
    vi.mocked(setDoc).mockClear()
  })

  it('writes the whole document built on the defaults when none exists', () => {
    const client = createQueryClient()
    client.setQueryData(profileQueryKey(uid), null)

    expect(updateProfile(client, uid, { defaultRestSec: 120 })).toBe('queued')

    const written = vi.mocked(setDoc).mock.calls[0]?.[1] as Profile
    expect(written).toEqual({
      ...defaultProfile,
      defaultRestSec: 120,
      updatedAt: written.updatedAt,
    })
    expect(written.updatedAt.toMillis()).toBeGreaterThan(0)
    expect(vi.mocked(setDoc).mock.calls[0]?.[2]).toBeUndefined()
  })

  it('merges only the edited keys into an existing profile, building on earlier unsynced edits', () => {
    const client = createQueryClient()
    client.setQueryData(profileQueryKey(uid), { ...defaultProfile })

    updateProfile(client, uid, { sounds: false })
    updateProfile(client, uid, { schedule: { mon: [{ source: 'own', id: 't1' }] } })

    const [, first, firstOptions] = vi.mocked(setDoc).mock.calls[0] ?? []
    const [, second] = vi.mocked(setDoc).mock.calls[1] ?? []
    expect(Object.keys(first as object).sort()).toEqual(['sounds', 'updatedAt'])
    expect(firstOptions).toEqual({ merge: true })
    // A merged schedule is sent whole, so each day is replaced, never merged item by item.
    expect(second).toMatchObject({
      schedule: { ...defaultProfile.schedule, mon: [{ source: 'own', id: 't1' }] },
    })
    expect(Object.keys(second as object).sort()).toEqual(['schedule', 'updatedAt'])
    expect(client.getQueryData(profileQueryKey(uid))).toMatchObject({
      sounds: false,
      schedule: { mon: [{ source: 'own', id: 't1' }] },
    })
  })

  it('reports an invalid change without touching the cache or writing', async () => {
    const client = createQueryClient()
    const errors = vi.fn()
    const stop = onWriteError(errors)
    const stored = { ...defaultProfile }
    client.setQueryData(profileQueryKey(uid), stored)

    updateProfile(client, uid, { defaultRestSec: -5 })
    await vi.waitFor(() => {
      expect(errors).toHaveBeenCalledWith(expect.anything(), 'profile')
    })

    expect(client.getQueryData(profileQueryKey(uid))).toBe(stored)
    expect(setDoc).not.toHaveBeenCalled()
    stop()
  })

  it('refuses an edit while the screens show defaults because the server has not answered', () => {
    const client = createQueryClient()
    client.setQueryData(profileQueryKey(uid), defaultProfile)

    expect(updateProfile(client, uid, { sounds: false })).toBe('not-loaded')

    expect(setDoc).not.toHaveBeenCalled()
    expect(client.getQueryData(profileQueryKey(uid))).toBe(defaultProfile)
    expect(toast).not.toHaveBeenCalled()
  })

  it('refuses to write before the profile is loaded', () => {
    expect(() => {
      updateProfile(createQueryClient(), uid, { sounds: false })
    }).toThrow('not loaded')
    expect(setDoc).not.toHaveBeenCalled()
  })
})

describe('ensureProfile', () => {
  const flush = () => new Promise((resolve) => setTimeout(resolve))
  const txSet = vi.fn<(ref: DocumentReference<Profile>, data: Profile) => void>()

  // Stands in for the server: the transaction's own get/set, not the top-level setDoc.
  const server = (exists: boolean | Error) => {
    vi.mocked(runTransaction).mockImplementation((_db, updateFunction) => {
      if (exists instanceof Error) return Promise.reject(exists)

      const tx = { get: () => Promise.resolve({ exists: () => exists }), set: txSet }
      return updateFunction(tx as unknown as Transaction)
    })
  }

  beforeEach(() => {
    txSet.mockClear()
  })

  it('creates the defaults when the server has no profile', async () => {
    server(false)

    const call: () => unknown = () => {
      ensureProfile(uid)
    }
    expect(call()).toBeUndefined()
    await flush()

    const [ref, written] = txSet.mock.calls[0] ?? []
    expect((ref as DocumentReference).path).toBe('users/user-1')
    expect(written).toEqual({ ...defaultProfile, updatedAt: written.updatedAt })
    expect(written.updatedAt.toMillis()).toBeGreaterThan(0)
  })

  it('writes nothing when the profile exists or the server cannot be reached', async () => {
    server(true)
    ensureProfile(uid)
    server(Object.assign(new Error('offline'), { code: 'unavailable' }))
    ensureProfile(uid)
    await flush()

    expect(txSet).not.toHaveBeenCalled()
  })

  it('does not crash or report a write error when offline', async () => {
    const errors = vi.fn()
    const stop = onWriteError(errors)
    server(Object.assign(new Error('offline'), { code: 'unavailable' }))

    expect(() => {
      ensureProfile(uid)
    }).not.toThrow()
    await flush()

    expect(errors).not.toHaveBeenCalled()
    stop()
  })

  it('reports any other failure (e.g. permission-denied) instead of leaving the user without a profile', async () => {
    const errors = vi.fn()
    const stop = onWriteError(errors)
    server(
      Object.assign(new Error('Missing or insufficient permissions'), {
        code: 'permission-denied',
      }),
    )

    expect(() => {
      ensureProfile(uid)
    }).not.toThrow()
    await vi.waitFor(() => {
      expect(errors).toHaveBeenCalledWith(expect.anything(), 'profile')
    })

    stop()
  })
})
