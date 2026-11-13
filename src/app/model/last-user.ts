import type { AuthUser } from '@/shared/api'

const KEY = 'pw:last-user'

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

// A snapshot of the last signed-in user, so a returning visitor sees the app frame instead of Splash
// while Auth restores the real session (3.4).
export function readLastUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null

    const { uid, displayName, email, photoURL } = value as Record<string, unknown>
    if (typeof uid !== 'string' || uid === '') return null
    if (!isStringOrNull(displayName) || !isStringOrNull(email) || !isStringOrNull(photoURL)) {
      return null
    }

    return { uid, displayName, email, photoURL }
  } catch {
    return null
  }
}

export function writeLastUser(user: AuthUser | null): void {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user))
    else localStorage.removeItem(KEY)
  } catch {
    // Private mode or a full quota: the snapshot is best-effort.
  }
}
