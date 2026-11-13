import { Navigate, Outlet, useLocation } from 'react-router'

import { useSessionStore } from '@/entities/session'

import { placeOf } from '../../lib/session-place'

export function SessionGuard() {
  const target = useSessionStore(placeOf)
  const { pathname } = useLocation()

  return pathname === target ? <Outlet /> : <Navigate to={target} replace />
}
