import { Navigate, Outlet, useLocation } from 'react-router'

import {
  selectActive,
  selectFinishing,
  useSessionStore,
  type SessionData,
} from '@/entities/session'

// contracts/routes.md: /session needs a running workout, /session/finish one waiting for its survey.
const placeOf = (s: SessionData) =>
  selectActive(s) ? '/session' : selectFinishing(s) ? '/session/finish' : '/'

export function SessionGuard() {
  const target = useSessionStore(placeOf)
  const { pathname } = useLocation()

  return pathname === target ? <Outlet /> : <Navigate to={target} replace />
}
