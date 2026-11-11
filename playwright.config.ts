import { defineConfig, devices } from '@playwright/test'

import { testPorts } from './scripts/lib/test-ports.ts'

const isCI = !!process.env.CI
// TEST_PORT_OFFSET=n moves the dev server, the preview and the emulators (scripts/test-env.ts).
const ports = testPorts()
const devURL = `http://127.0.0.1:${String(ports.vite)}`
const previewURL = `http://127.0.0.1:${String(ports.preview)}`
// The offline project needs a production build; it runs in CI, `pnpm check` and `pnpm e2e:offline`.
const offline = isCI || process.env.E2E_OFFLINE === '1'

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  forbidOnly: isCI,
  // shortcut: the fixture resets the shared emulators, so parallel projects would wipe each other; switch to per-test uids when the suite gets slow.
  workers: 1,
  retries: isCI ? 2 : 0,
  // A broken build stops after 10 failures instead of retrying the whole suite.
  maxFailures: isCI ? 10 : 0,
  // list: live progress in the CI log; html: the report uploaded on failure.
  reporter: isCI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  use: {
    baseURL: devURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile',
      testIgnore: 'offline.spec.ts',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'desktop',
      testIgnore: 'offline.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    ...(offline
      ? [
          {
            name: 'offline',
            testMatch: 'offline.spec.ts',
            use: {
              ...devices['Pixel 7'],
              viewport: { width: 390, height: 844 },
              baseURL: previewURL,
              serviceWorkers: 'allow' as const,
            },
          },
        ]
      : []),
  ],
  webServer: [
    {
      // Not through pnpm: it moves its script to another process group, out of reach of the shutdown.
      command: 'node scripts/test-env.ts dev',
      url: devURL,
      reuseExistingServer: !isCI,
      // The sign-in hook of e2e/fixtures/auth.ts exists only in this build.
      env: { VITE_E2E: '1' },
      // The default SIGKILL leaves the Firestore emulator's JVM running on its port.
      gracefulShutdown: { signal: 'SIGINT', timeout: 10_000 },
    },
    // A production build with the service worker, for e2e/offline.spec.ts only.
    ...(offline
      ? [
          {
            command: 'node scripts/test-env.ts preview',
            url: previewURL,
            reuseExistingServer: !isCI,
            timeout: 180_000,
            gracefulShutdown: { signal: 'SIGINT' as const, timeout: 10_000 },
          },
        ]
      : []),
  ],
})
