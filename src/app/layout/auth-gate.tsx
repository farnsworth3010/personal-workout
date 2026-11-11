import { Navigate, Outlet } from 'react-router'

import { Splash } from '../routes/splash'

import { useAuth, type AuthState } from './auth-context'

// contracts/routes.md: each branch admits one status and sends the other one away.
function gate(allowed: AuthState['status'], elsewhere: string) {
  return function Gate() {
    const { status } = useAuth()

    // The splash rather than the login page while Firebase restores the session.
    if (status === 'loading') return <Splash />

    return status === allowed ? <Outlet /> : <Navigate to={elsewhere} replace />
  }
}

export const AuthGate = gate('signedIn', '/login')

export const GuestGate = gate('signedOut', '/')
