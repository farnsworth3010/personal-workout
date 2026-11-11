// Emulators and Vite on a Tailscale address, so other devices can sign in to the dev server.
// Usage: DEV_HOST=<tailscale-ip> [DEV_PORT=5173] pnpm dev:remote
//        DEV_HOST=<tailscale-ip> [DEV_PORT=5173] pnpm preview:remote   (production build, vite preview)
// TEST_PORT_OFFSET moves the emulators to that test environment's ports, to try it beside a running demo.
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { runInGroup } from './lib/run-group.ts'
import { remotePorts, testPorts } from './lib/test-ports.ts'

const preview = process.argv[2] === 'preview'
const ports = process.env.TEST_PORT_OFFSET ? testPorts() : remotePorts

const host = process.env.DEV_HOST
if (!host || host === '0.0.0.0') {
  console.error('dev:remote needs DEV_HOST set to this machine’s Tailscale IP, e.g.')
  console.error('  DEV_HOST=<tailscale-ip> pnpm dev:remote')
  process.exit(1)
}
const port = process.env.DEV_PORT ?? '5173'

// Its own demo project keeps the emulator hub apart from `pnpm test:rules` and `pnpm e2e`.
const projectId = 'demo-workout-remote'
const authHost = `${host}:${String(ports.auth)}`
const firestoreHost = `${host}:${String(ports.firestore)}`

const dir = resolve('node_modules/.cache/dev-remote')
mkdirSync(dir, { recursive: true })
const config = join(dir, 'firebase.json')
writeFileSync(
  config,
  JSON.stringify({
    firestore: { rules: resolve('firestore.rules') },
    emulators: {
      singleProjectMode: true,
      auth: { host, port: ports.auth },
      firestore: { host, port: ports.firestore, websocketPort: ports.websocket },
      hub: { host, port: ports.hub },
      logging: { host, port: ports.logging },
      ui: { enabled: false },
    },
  }),
)

// The app reaches the Auth emulator through Vite's proxy on its own origin (scripts/vite.remote.config.ts).
const env = {
  ...process.env,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_AUTH_EMULATOR_HOST: 'same-origin',
  DEV_AUTH_EMULATOR: `http://${authHost}`,
  VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: firestoreHost,
}
const bin = resolve('node_modules/.bin/vite')
const viteConfig = resolve('scripts/vite.remote.config.ts')
const outDir = 'dist-remote'

// Mode e2e: a production bundle wired to the emulators (.env.e2e, never .env.production.local);
// the variables above outrank .env.e2e, so it talks to this script's emulators and project.
if (preview) {
  const build = spawnSync(
    bin,
    ['build', '--config', viteConfig, '--mode', 'e2e', '--outDir', outDir],
    {
      stdio: 'inherit',
      env,
    },
  )
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const server = preview ? `preview --mode e2e --outDir ${outDir} ` : ''
const vite = `"${bin}" ${server}--config "${viteConfig}" --host ${host} --port ${port} --strictPort`
runInGroup(
  resolve('node_modules/.bin/firebase'),
  ['emulators:exec', '--config', config, '--project', projectId, '--only', 'auth,firestore', vite],
  env,
)
