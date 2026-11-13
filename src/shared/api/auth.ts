import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'

import { clearIndexedDbPersistence, terminate } from 'firebase/firestore'

import { auth, db } from './firebase'

export interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

type AuthErrorListener = (error: unknown) => void

const listeners = new Set<AuthErrorListener>()

export function onAuthError(listener: AuthErrorListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function report(error: unknown) {
  if (listeners.size === 0) console.error('Auth failed', error)
  for (const listener of listeners) listener(error)
}

// Set right before signInWithRedirect; completeRedirectSignIn skips getRedirectResult when absent,
// so a cold start with no sign-in in progress never waits on the handler iframe.
const REDIRECT_PENDING_KEY = 'pw:redirect'

// The page that completes sign-in: the Auth emulator, or the authDomain host in production.
function handlerOrigin(): string {
  const emulator = auth.emulatorConfig
  const url = emulator
    ? `${emulator.protocol}://${emulator.host}${emulator.port === null ? '' : `:${String(emulator.port)}`}`
    : `https://${auth.app.options.authDomain ?? ''}`

  return new URL(url).origin
}

// Research R3: a redirect result reaches the app through a handler-origin iframe, whose storage
// Safari partitions unless the handler is the app's own origin; elsewhere use a popup.
export function signInWithGoogle(): void {
  const provider = new GoogleAuthProvider()
  const flow =
    import.meta.env.VITE_AUTH_FLOW ?? (handlerOrigin() === location.origin ? 'redirect' : 'popup')

  if (flow === 'redirect') sessionStorage.setItem(REDIRECT_PENDING_KEY, '1')
  const start = flow === 'popup' ? signInWithPopup : signInWithRedirect

  start(auth, provider).catch(report)
}

export function completeRedirectSignIn(): Promise<void> {
  if (sessionStorage.getItem(REDIRECT_PENDING_KEY) === null) return Promise.resolve()

  sessionStorage.removeItem(REDIRECT_PENDING_KEY)
  return getRedirectResult(auth).then(() => undefined, report)
}

// Leaves nothing of this user on the device: the Firestore cache, localStorage (the running session) and,
// through the reload, every in-memory cache. Throws the running session away: confirm before calling.
export function signOutUser(): void {
  signOut(auth)
    .then(async () => {
      await terminate(db)
      // Fails while another tab holds the cache; the reload below still drops this tab's data.
      await clearIndexedDbPersistence(db).catch(report)
      localStorage.clear()
      location.reload()
    })
    .catch(report)
}

export function subscribeAuth(listener: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(
    auth,
    (user) =>
      listener(
        user && {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        },
      ),
    report,
  )
}
