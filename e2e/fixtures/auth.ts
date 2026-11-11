import { test as base, type Page } from '@playwright/test'

import { authEmulator, firestoreEmulator, projectId } from './emulators'

export { expect } from '@playwright/test'

export interface TestUser {
  uid: string
  email: string
}

async function emulatorFetch(url: string, init: RequestInit): Promise<void> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`Emulator request failed: ${url} ${response.status}`)
}

// Needs the web server built with VITE_E2E=1, which exposes the hook from src/shared/api/test-auth.ts.
export async function signIn(page: Page, user: TestUser): Promise<void> {
  // The emulator would give a new Google account a random uid; a linked account keeps user.uid.
  await emulatorFetch(
    `${authEmulator}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchCreate`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allowOverwrite: true,
        users: [
          {
            localId: user.uid,
            email: user.email,
            emailVerified: true,
            providerUserInfo: [{ providerId: 'google.com', rawId: user.uid, email: user.email }],
          },
        ],
      }),
    },
  )

  await page.waitForFunction(() => '__signInForTest' in window)
  await page.evaluate(
    ({ uid, email }) =>
      (
        window as unknown as { __signInForTest: (uid: string, email: string) => Promise<void> }
      ).__signInForTest(uid, email),
    user,
  )
}

export async function resetEmulators(): Promise<void> {
  await Promise.all([
    emulatorFetch(`${authEmulator}/emulator/v1/projects/${projectId}/accounts`, {
      method: 'DELETE',
    }),
    emulatorFetch(
      `${firestoreEmulator}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
      { method: 'DELETE' },
    ),
  ])
}

// shortcut: the reset wipes both emulators, so tests must run with one worker; per-test uids otherwise.
export const test = base.extend<{ cleanEmulators: undefined }>({
  cleanEmulators: [
    async ({}, use) => {
      await resetEmulators()
      await use(undefined)
    },
    { auto: true },
  ],
})
