import { selectActive, selectFinishing, type SessionData } from '@/entities/session'

// contracts/routes.md: /session needs a running workout, /session/finish one waiting for its survey.
export const placeOf = (s: SessionData) =>
  selectActive(s) ? '/session' : selectFinishing(s) ? '/session/finish' : '/'
