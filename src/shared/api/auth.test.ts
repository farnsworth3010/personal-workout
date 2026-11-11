import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  completeRedirectSignIn,
  onAuthError,
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
} from './auth'

const fb = vi.hoisted(() => ({
  getRedirectResult: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('firebase/auth', () => fb)
const auth = vi.hoisted(() => ({
  name: 'auth',
  emulatorConfig: null as { protocol: string; host: string; port: number | null } | null,
  app: { options: { authDomain: 'personal-workout.firebaseapp.com' } },
}))
vi.mock('./firebase', () => ({ auth }))

const flush = () => new Promise((resolve) => setTimeout(resolve))

describe('auth', () => {
  const errors = vi.fn()
  let unsubscribe: () => void

  beforeEach(() => {
    vi.resetAllMocks()
    fb.signInWithRedirect.mockResolvedValue(undefined)
    fb.signInWithPopup.mockResolvedValue(undefined)
    auth.emulatorConfig = null
    vi.stubGlobal('location', { origin: 'https://personal-workout.firebaseapp.com' })
    unsubscribe = onAuthError(errors)
  })

  afterEach(() => {
    unsubscribe()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const flowUsed = () => {
    signInWithGoogle()

    expect(fb.signInWithRedirect.mock.calls.length + fb.signInWithPopup.mock.calls.length).toBe(1)
    return fb.signInWithRedirect.mock.calls.length ? 'redirect' : 'popup'
  }

  it('redirects when the app is served from the authDomain host', () => {
    // Typed as returning unknown so the assertion would catch a leaked promise.
    const call: () => unknown = signInWithGoogle
    expect(call()).toBeUndefined()
    expect(fb.signInWithRedirect).toHaveBeenCalledWith(auth, expect.any(fb.GoogleAuthProvider))
    expect(fb.signInWithPopup).not.toHaveBeenCalled()
  })

  it('uses a popup when the app is served from another host than authDomain', () => {
    vi.stubGlobal('location', { origin: 'https://personal-workout.web.app' })

    expect(flowUsed()).toBe('popup')
  })

  it('uses a popup when the Auth emulator listens on another port', () => {
    auth.emulatorConfig = { protocol: 'http', host: '127.0.0.1', port: 9099 }
    vi.stubGlobal('location', { origin: 'http://127.0.0.1:5173' })

    expect(flowUsed()).toBe('popup')
  })

  it('lets VITE_AUTH_FLOW override the choice in both directions', () => {
    vi.stubEnv('VITE_AUTH_FLOW', 'popup')
    expect(flowUsed()).toBe('popup')

    vi.resetAllMocks()
    vi.stubEnv('VITE_AUTH_FLOW', 'redirect')
    vi.stubGlobal('location', { origin: 'https://personal-workout.web.app' })
    fb.signInWithRedirect.mockResolvedValue(undefined)
    expect(flowUsed()).toBe('redirect')
  })

  it('reports sign-in and sign-out failures to onAuthError', async () => {
    const error = new Error('auth/network-request-failed')
    fb.signInWithRedirect.mockRejectedValue(error)
    fb.signOut.mockRejectedValue(error)

    signInWithGoogle()
    signOutUser()
    await flush()

    expect(errors.mock.calls).toEqual([[error], [error]])
  })

  it('completes the redirect and reports its failure without rejecting', async () => {
    const error = new Error('auth/popup-closed-by-user')
    fb.getRedirectResult.mockResolvedValueOnce(null).mockRejectedValueOnce(error)

    await expect(completeRedirectSignIn()).resolves.toBeUndefined()
    await expect(completeRedirectSignIn()).resolves.toBeUndefined()

    expect(errors.mock.calls).toEqual([[error]])
  })

  it('maps the Firebase user to AuthUser and passes the unsubscribe through', () => {
    const stop = vi.fn()
    fb.onAuthStateChanged.mockReturnValue(stop)
    const listener = vi.fn()

    expect(subscribeAuth(listener)).toBe(stop)
    const [, next] = fb.onAuthStateChanged.mock.lastCall as [unknown, (u: unknown) => void]
    next({ uid: 'a', displayName: 'A', email: 'a@x.dev', photoURL: null, providerId: 'firebase' })
    next(null)

    expect(listener.mock.calls).toEqual([
      [{ uid: 'a', displayName: 'A', email: 'a@x.dev', photoURL: null }],
      [null],
    ])
  })
})
