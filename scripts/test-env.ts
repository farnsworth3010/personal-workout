// Runs a test environment on the ports of TEST_PORT_OFFSET (scripts/lib/test-ports.ts), so several
// agents can run rules tests and e2e at once. Offset 0 is exactly firebase.json.
// Usage: [TEST_PORT_OFFSET=700] node scripts/test-env.ts rules | dev | preview
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { runInGroup } from './lib/run-group.ts'
import { testPorts } from './lib/test-ports.ts'

const ports = testPorts()
const mode = process.argv[2]
const bin = (name: string) => resolve('node_modules/.bin', name)

const env = {
  ...process.env,
  FIRESTORE_EMULATOR_HOST: `127.0.0.1:${ports.firestore}`,
  FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${ports.auth}`,
  VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: `127.0.0.1:${ports.firestore}`,
  VITE_FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${ports.auth}`,
}

// Offset 0 uses firebase.json itself; any other offset a copy with every emulator port shifted.
function configArgs(): string[] {
  if (!ports.offset) return []

  const dir = resolve('node_modules/.cache/test-env', String(ports.offset))
  mkdirSync(dir, { recursive: true })
  const config = join(dir, 'firebase.json')
  const host = '127.0.0.1'
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

  return ['--config', config, '--project', 'demo-workout']
}

const emulators = (only: string, script: string) =>
  runInGroup(bin('firebase'), ['emulators:exec', ...configArgs(), '--only', only, script], env)

if (mode === 'rules') emulators('firestore', `"${bin('vitest')}" run --project rules`)
else if (mode === 'dev')
  emulators('auth,firestore', `"${bin('vite')}" --host 127.0.0.1 --port ${ports.vite} --strictPort`)
else if (mode === 'preview') {
  const outDir = ports.offset ? `dist-e2e-${ports.offset}` : 'dist-e2e'
  const build = spawnSync(bin('vite'), ['build', '--mode', 'e2e', '--outDir', outDir], {
    stdio: 'inherit',
    env,
  })
  if (build.status !== 0) process.exit(build.status ?? 1)

  runInGroup(
    bin('vite'),
    [
      'preview',
      '--mode',
      'e2e',
      '--outDir',
      outDir,
      '--host',
      '127.0.0.1',
      '--port',
      String(ports.preview),
      '--strictPort',
    ],
    env,
  )
} else {
  console.error('Usage: [TEST_PORT_OFFSET=<0-999>] node scripts/test-env.ts rules | dev | preview')
  process.exit(1)
}
