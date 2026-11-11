import { getDocFromServer, setDoc, type DocumentReference } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryClient, onWriteError, type Profile } from '@/shared/api'

import { defaultProfile } from '../model/profile'
import { ensureProfile, profileQueryKey, updateProfile } from './profile'

vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  setDoc: vi.fn(() => new Promise<void>(() => undefined)),
  getDocFromServer: vi.fn(),
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

    updateProfile(client, uid, { defaultRestSec: 120 })

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

    updateProfile(client, uid, { sounds: false })

    expect(setDoc).not.toHaveBeenCalled()
    expect(client.getQueryData(profileQueryKey(uid))).toBe(defaultProfile)
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('не загрузился'))
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
  const server = (exists: boolean | Error) => {
    vi.mocked(getDocFromServer).mockImplementation(() =>
      exists instanceof Error
        ? Promise.reject(exists)
        : Promise.resolve({ exists: () => exists } as never),
    )
  }

  beforeEach(() => {
    vi.mocked(setDoc).mockClear()
  })

  it('creates the defaults when the server has no profile', async () => {
    server(false)

    const call: () => unknown = () => {
      ensureProfile(uid)
    }
    expect(call()).toBeUndefined()
    await flush()

    const [ref, written] = vi.mocked(setDoc).mock.calls[0] ?? []
    expect((ref as DocumentReference).path).toBe('users/user-1')
    expect(written).toEqual({ ...defaultProfile, updatedAt: (written as Profile).updatedAt })
    expect((written as Profile).updatedAt.toMillis()).toBeGreaterThan(0)
  })

  it('writes nothing when the profile exists or the server cannot be reached', async () => {
    server(true)
    ensureProfile(uid)
    server(new Error('offline'))
    ensureProfile(uid)
    await flush()

    expect(setDoc).not.toHaveBeenCalled()
  })
})
