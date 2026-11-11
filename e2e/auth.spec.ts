import type { Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'
import { seedProfile } from './fixtures/seed'

const alice = { uid: 'alice', email: 'alice@example.com' }
const bob = { uid: 'bob', email: 'bob@example.com' }

// Every route of contracts/routes.md behind the gate.
const routes = [
  '/',
  '/templates',
  '/templates/new',
  '/templates/some-id',
  '/exercises',
  '/session',
  '/session/finish',
  '/stats',
  '/settings',
]

const loginButton = (page: Page) => page.getByRole('button', { name: 'Войти через Google' })

async function signInAs(page: Page, user: typeof alice) {
  await page.goto('/login')
  await signIn(page, user)
  await expect(page).toHaveURL('/')
}

test('a signed-out visitor sees only the login page on every route', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route)

    await expect(page, route).toHaveURL('/login')
    await expect(loginButton(page)).toBeVisible()
    await expect(page.getByRole('navigation')).toHaveCount(0)
  }
})

test('after sign-in the person lands on today and leaves /login', async ({ page }) => {
  await signInAs(page, alice)
  await expect(page.getByRole('heading', { level: 1, name: 'Сегодня' })).toBeVisible()

  await page.goto('/login')
  await expect(page).toHaveURL('/')
})

test('sign-out returns to login and hides the data', async ({ page }) => {
  await seedProfile(alice.uid, { homeEquipment: ['dumbbell', 'pull-up bar'] })
  await signInAs(page, alice)
  await page.goto('/settings')
  await expect(page.getByText(alice.email)).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Гантели' })).toBeChecked()

  await page.getByRole('button', { name: 'Выйти' }).click()

  await expect(page).toHaveURL('/login')
  await expect(loginButton(page)).toBeVisible()
  await expect(page.getByText(alice.email)).toHaveCount(0)

  await page.goBack()
  await expect(page).toHaveURL('/login')
  await expect(page.getByText(/Гантели/)).toHaveCount(0)
})

test("a second account sees none of the first account's profile", async ({ page }) => {
  await seedProfile(alice.uid, { homeEquipment: ['dumbbell', 'pull-up bar'] })
  await signInAs(page, alice)
  await page.goto('/settings')
  await expect(page.getByRole('checkbox', { name: 'Гантели' })).toBeChecked()
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page).toHaveURL('/login')

  await signIn(page, bob)
  await expect(page).toHaveURL('/')
  await page.goto('/settings')

  await expect(page.getByText(bob.email)).toBeVisible()
  const dumbbells = page.getByRole('checkbox', { name: 'Гантели' })
  await expect(dumbbells).toBeEnabled()
  await expect(dumbbells).not.toBeChecked()
})
