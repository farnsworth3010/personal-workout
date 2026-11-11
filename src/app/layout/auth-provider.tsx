import { useEffect, useRef, useState, type ReactNode } from 'react'

import { ensureProfile } from '@/entities/profile'
import { completeRedirectSignIn, onAuthError, subscribeAuth, type AuthUser } from '@/shared/api'
import { toast } from '@/shared/ui'

import { AuthContext, loading, type AuthState } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loading)
  const redirect = useRef<Promise<void>>(null)

  // Here, not on the login page: a failed redirect is reported before that page has loaded.
  useEffect(() => onAuthError(() => toast('Не удалось войти. Попробуйте ещё раз.')), [])

  useEffect(() => {
    // StrictMode runs effects twice; the ref survives it, so the redirect completes once.
    redirect.current ??= completeRedirectSignIn()

    let user: AuthUser | null | undefined
    let redirectDone = false
    let active = true

    // Waiting for both keeps the login page from flashing while a redirect sign-in completes.
    const publish = () => {
      if (!active || !redirectDone || user === undefined) return

      setState(user ? { status: 'signedIn', user } : { status: 'signedOut', user: null })
    }

    void redirect.current.then(() => {
      redirectDone = true
      publish()
    })

    const unsubscribe = subscribeAuth((next) => {
      if (next) ensureProfile(next.uid)
      user = next
      publish()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return <AuthContext value={state}>{children}</AuthContext>
}
