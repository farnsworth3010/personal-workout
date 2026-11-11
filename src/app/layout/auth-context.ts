import { createContext, useContext } from 'react'

import type { AuthUser } from '@/shared/api'

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: AuthUser }

export const loading: AuthState = { status: 'loading', user: null }

export const AuthContext = createContext<AuthState>(loading)

export const useAuth = () => useContext(AuthContext)
