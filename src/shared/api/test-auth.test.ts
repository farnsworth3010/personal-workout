import { describe, expect, it, vi } from 'vitest'

import { signInForTest } from './test-auth'

const fb = vi.hoisted(() => ({
  GoogleAuthProvider: { credential: vi.fn((token: string) => ({ token })) },
  signInWithCredential: vi.fn(),
}))
vi.mock('firebase/auth', () => fb)
vi.mock('./firebase', () => ({ auth: { name: 'auth' } }))

describe('signInForTest', () => {
  it('signs in with an emulator Google token carrying the uid and email', async () => {
    await signInForTest('A', 'a@x.dev')

    const [token] = fb.GoogleAuthProvider.credential.mock.lastCall ?? []
    expect(JSON.parse(token ?? '')).toEqual({ sub: 'A', email: 'a@x.dev', email_verified: true })
    expect(fb.signInWithCredential).toHaveBeenCalledWith({ name: 'auth' }, { token })
  })
})
