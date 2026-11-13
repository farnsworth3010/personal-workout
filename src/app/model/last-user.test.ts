import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUser } from '@/shared/api'

import { readLastUser, writeLastUser } from './last-user'

const alice: AuthUser = { uid: 'a', displayName: 'Alice', email: 'a@x.dev', photoURL: null }

describe('last-user', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    })
  })

  it('round-trips a user', () => {
    writeLastUser(alice)

    expect(readLastUser()).toEqual(alice)
  })

  it('is null after writing null', () => {
    writeLastUser(alice)
    writeLastUser(null)

    expect(readLastUser()).toBeNull()
  })

  it('is null for broken JSON', () => {
    localStorage.setItem('pw:last-user', '{not json')

    expect(readLastUser()).toBeNull()
  })

  it('is null for a value missing the expected shape', () => {
    localStorage.setItem('pw:last-user', JSON.stringify({ uid: 1 }))

    expect(readLastUser()).toBeNull()
  })

  it('does not throw when localStorage.setItem throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('quota')
      },
    })

    expect(() => writeLastUser(alice)).not.toThrow()
  })
})
