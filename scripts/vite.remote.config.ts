// dev:remote and preview:remote: the Auth emulator behind the app's own origin, so sign-in uses the same-origin
// redirect like production (research R3) instead of a cross-origin popup, which iOS Safari opens as a tab.
import { mergeConfig } from 'vite'

import base from '../vite.config.ts'

const target = process.env.DEV_AUTH_EMULATOR
if (!target) throw new Error('DEV_AUTH_EMULATOR is set by scripts/dev-remote.ts')

// The SDK calls the emulator at <emulator url>/<api host>/..., and its handler and iframe under /emulator.
const proxy = Object.fromEntries(
  ['/emulator', '/identitytoolkit.googleapis.com', '/securetoken.googleapis.com'].map((path) => [
    path,
    target,
  ]),
)

export default mergeConfig(base, { server: { proxy }, preview: { proxy } })
