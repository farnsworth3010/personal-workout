import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-workout'

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
  projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)

export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  // Node and jsdom (tests) have no IndexedDB.
  localCache:
    typeof indexedDB === 'undefined'
      ? memoryLocalCache()
      : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

// Direct import.meta.env reads are replaced at build time, so production drops these branches.
if (import.meta.env.DEV || import.meta.env.MODE === 'test' || import.meta.env.VITE_E2E === '1') {
  const authHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'
  const [firestoreHost, firestorePort] = (
    import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
  ).split(':')

  // The warning banner would cover the bottom navigation in dev and e2e screenshots.
  connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true })
  connectFirestoreEmulator(db, firestoreHost, Number(firestorePort))
}

if (import.meta.env.MODE === 'test' || import.meta.env.VITE_E2E === '1') void import('./test-auth')
