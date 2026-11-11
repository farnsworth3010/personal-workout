interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  // host:port, or 'same-origin' (dev:remote's proxy)
  readonly VITE_FIREBASE_AUTH_EMULATOR_HOST?: string
  readonly VITE_FIREBASE_FIRESTORE_EMULATOR_HOST?: string
  readonly VITE_AUTH_FLOW?: 'redirect' | 'popup'
  readonly VITE_E2E?: string
}
