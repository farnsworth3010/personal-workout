import { AppFrame } from '../../layout/app-frame'
import { readLastUser } from '../../model/last-user'
import { Splash } from '../splash'

// HydrateFallback for the root route: a returning user sees the app frame instead of the splash (3.4).
export function BootFallback() {
  return readLastUser() ? <AppFrame /> : <Splash />
}
