import { Navigate, Outlet } from 'react-router'

import { useAuth, type AuthState } from '../../model/auth-context'
import { Splash } from '../../routes/splash'

// contracts/routes.md: each branch admits one status and sends the other one away.
export function Gate({ allowed, elsewhere }: { allowed: AuthState['status']; elsewhere: string }) {
  const { status } = useAuth()

  // The splash rather than the login page while Firebase restores the session.
  if (status === 'loading') return <Splash />

  return status === allowed ? <Outlet /> : <Navigate to={elsewhere} replace />
}
