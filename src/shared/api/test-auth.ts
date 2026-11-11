import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'

import { auth } from './firebase'

declare global {
  interface Window {
    __signInForTest?: typeof signInForTest
  }
}

// Research R3: the Auth emulator accepts an unsigned Google ID token given as JSON claims.
export async function signInForTest(uid: string, email: string): Promise<void> {
  const idToken = JSON.stringify({ sub: uid, email, email_verified: true })

  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
}

if (typeof window !== 'undefined') window.__signInForTest = signInForTest
