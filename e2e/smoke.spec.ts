import type { Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'

const destinations = [
  { label: 'Сегодня', path: '/', heading: 'Сегодня' },
  { label: 'Наборы', path: '/templates', heading: 'Наборы' },
  { label: 'Упражнения', path: '/exercises', heading: 'Упражнения' },
  { label: 'Статистика', path: '/stats', heading: 'Статистика' },
  { label: 'Профиль', path: '/settings', heading: 'Профиль' },
]

const routes = [
  '/',
  '/templates',
  '/templates/new',
  '/templates/some-id',
  '/exercises',
  '/stats',
  '/settings',
  '/login',
  '/session',
  '/session/finish',
  '/no-such-page',
]

const nav = (page: Page) => page.getByRole('navigation', { name: 'Разделы' })

// Every check here needs the shell behind the auth gate.
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await signIn(page, { uid: 'smoke', email: 'smoke@example.com' })
  await expect(page).toHaveURL('/')
})

test('the shell renders in the dark theme with the navigation of the viewport', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Сегодня' })).toBeVisible()
  await expect(nav(page)).toBeVisible()

  const layout = await page.evaluate(() => {
    // A probe normalises the token (#0a0a0a) to the same rgb() form as the computed body colour.
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--background)'
    document.body.append(probe)
    const token = getComputedStyle(probe).backgroundColor
    probe.remove()

    return { body: getComputedStyle(document.body).backgroundColor, token }
  })
  expect(layout.token).not.toBe('rgba(0, 0, 0, 0)')
  expect(layout.body).toBe(layout.token)

  const box = await nav(page).boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport) throw new Error('No layout')

  if (viewport.width < 900) {
    // Bottom bar across the full width.
    expect(box.width).toBe(viewport.width)
    expect(box.y + box.height).toBe(viewport.height)
    expect(box.height).toBeLessThanOrEqual(80)
  } else {
    // Left sidebar over the full height.
    expect(box.x).toBe(0)
    expect(box.width).toBe(220)
    expect(box.height).toBe(viewport.height)
  }
})

test('each destination opens its page and becomes current', async ({ page }) => {
  await page.goto('/settings')

  for (const { label, path, heading } of destinations) {
    const link = nav(page).getByRole('link', { name: label })
    await link.click()

    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(link).toHaveAttribute('aria-current', 'page')
  }
})

test('the session has no navigation', async ({ page }) => {
  // /session needs a running workout: the new profile has a rest day, so start any ready-made set.
  await page.getByRole('button', { name: 'Другая тренировка' }).click()
  await page.getByRole('region', { name: 'Готовые наборы' }).getByRole('button').first().click()

  await expect(page).toHaveURL('/session')
  await expect(page.getByRole('button', { name: 'Подход сделан' })).toBeVisible()
  await expect(nav(page)).toHaveCount(0)
})

test('an unknown route links home', async ({ page }) => {
  await page.goto('/no-such-page')
  await page.getByRole('link', { name: 'На главную' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Сегодня' })).toBeVisible()
})

test('no route overflows a 360px screen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'a phone width check')
  await page.setViewportSize({ width: 360, height: 780 })

  for (const route of routes) {
    await page.goto(route)
    // Rendered and loaded; not every state has an h1 (a missing set shows only a notice).
    await expect(page.getByRole('main'), route).not.toBeEmpty()
    await expect(page.getByRole('main'), route).not.toContainText('Загрузка')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow, route).toBeLessThanOrEqual(0)
  }
})
