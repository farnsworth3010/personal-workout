import type { Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'
import { firestoreDocuments } from './fixtures/emulators'
import { seedProfile, seedWorkouts } from './fixtures/seed'

const user = { uid: 'today', email: 'today@example.com' }

const weekday = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[new Date().getDay()]
const emptyWeek = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }

const warmUp = { source: 'ready', id: 'warm-up' } as const
const back = { source: 'ready', id: 'back-care' } as const

const todaySets = (page: Page) =>
  page.getByRole('list', { name: 'Наборы на сегодня' }).locator(':scope > li')

// The week row of today.
const todayRow = (page: Page) => page.locator('button[aria-current="date"]')

// The ids of today's sets as the server has them, read as the emulator owner.
async function savedToday() {
  const response = await fetch(`${firestoreDocuments}/users/${user.uid}`, {
    headers: { Authorization: 'Bearer owner' },
  })
  const doc = (await response.json()) as {
    fields?: {
      schedule?: {
        mapValue: {
          fields: Record<
            string,
            { arrayValue: { values?: { mapValue: { fields: { id: { stringValue: string } } } }[] } }
          >
        }
      }
    }
  }
  const day = doc.fields?.schedule?.mapValue.fields[weekday]?.arrayValue.values ?? []

  return day.map((ref) => ref.mapValue.fields.id.stringValue)
}

async function open(page: Page) {
  await page.goto('/login')
  await signIn(page, user)
  await expect(page).toHaveURL('/')
}

// spec.md User Story 5, independent test.
test('two sets today: the finished one is marked, the other waits, clearing makes a rest day', async ({
  page,
}) => {
  const now = new Date()
  await seedProfile(user.uid, { schedule: { ...emptyWeek, [weekday]: [warmUp, back] } })
  await seedWorkouts(user.uid, [
    {
      id: 'w1',
      // Just after midnight, so the workout is today whenever the test runs.
      startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1),
      template: { ...warmUp, name: 'Разминка' },
      entries: [{ exerciseId: 'Pushups', sets: [{ reps: 10 }] }],
    },
  ])
  await open(page)

  await expect(page.getByText(/сделано 1 из 2/)).toBeVisible()
  await expect(todaySets(page)).toHaveCount(2)
  await expect(todaySets(page).nth(0)).toContainText('Разминка')
  await expect(todaySets(page).nth(0)).toContainText('Сделано в')
  await expect(
    todaySets(page)
      .nth(1)
      .getByRole('button', { name: /^Спина/, expanded: true }),
  ).toBeVisible()
  await expect(
    todaySets(page).nth(1).getByRole('button', { name: 'Начать тренировку' }),
  ).toBeVisible()

  await todayRow(page).click()
  await page.getByRole('button', { name: 'Без тренировки' }).click()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('heading', { name: 'День отдыха' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'День отдыха' })).toBeVisible()
})

test('the day sheet adds, reorders and removes sets and keeps them', async ({ page }) => {
  await seedProfile(user.uid, { schedule: { ...emptyWeek, [weekday]: [warmUp] } })
  await open(page)

  await todayRow(page).click()
  await page.getByRole('button', { name: '+ Добавить набор' }).click()
  await page.getByRole('button', { name: /^Спина/ }).click()
  await page.getByRole('button', { name: 'Выше: Спина' }).click()

  const slots = page.getByRole('list', { name: 'Наборы дня' }).locator(':scope > li')
  await expect(slots).toHaveText([/1\. Спина/, /2\. Разминка/])
  await page.keyboard.press('Escape')

  // Writes are fired, not awaited: a reload must not race the last one.
  await expect.poll(savedToday).toEqual(['back-care', 'warm-up'])
  await page.reload()
  await expect(todaySets(page)).toHaveCount(2)
  await expect(todaySets(page).nth(0)).toContainText('Спина')

  await todayRow(page).click()
  await page.getByRole('button', { name: 'Убрать: Разминка' }).click()
  await expect(slots).toHaveCount(1)
})

// FR-044: another set starts for today only.
test('another set starts from today and leaves the schedule as it was', async ({ page }) => {
  await seedProfile(user.uid, { schedule: { ...emptyWeek, [weekday]: [warmUp] } })
  await open(page)

  await page.getByRole('button', { name: 'Другая тренировка' }).click()
  await page
    .getByRole('region', { name: 'Готовые наборы' })
    .getByRole('button', { name: /Растяжка/ })
    .click()
  await expect(page).toHaveURL('/session')

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Продолжить тренировку' })).toBeVisible()
  await expect(todaySets(page)).toHaveCount(1)
  await expect(todaySets(page).nth(0)).toContainText('Разминка')
})

// FR-045: on a phone a tap starts nothing; a one-second hold starts the set.
test('a set starts on touch only after a hold', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'touch input')
  await seedProfile(user.uid, { schedule: { ...emptyWeek, [weekday]: [warmUp, back] } })
  await open(page)

  const start = todaySets(page).nth(1).getByRole('button', { name: 'Начать' })
  // tap() returns after the 1.2 s hint is gone, so the hint itself is left to the component test.
  await start.tap()
  await page.waitForTimeout(1500)
  await expect(page).toHaveURL('/')

  await start.dispatchEvent('pointerdown', { pointerType: 'touch' })
  await expect(page).toHaveURL('/session', { timeout: 3000 })
})

// A workout finished while Today was not mounted must not show the previous one first.
test('the last workout is never the stale one on returning to today', async ({ page }) => {
  const now = new Date()
  await seedProfile(user.uid, { schedule: emptyWeek })
  await seedWorkouts(user.uid, [
    {
      id: 'old',
      startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18),
      template: { source: 'ready', id: 'gym-push', name: 'День груди · C' },
      entries: [{ exerciseId: 'Pushups', sets: [{ reps: 10 }] }],
    },
  ])
  await open(page)
  await expect(page.getByText('Последняя тренировка · День груди · C')).toBeVisible()

  // Leave Today without a reload, so its history listener closes and its cache stays behind.
  await page
    .getByRole('navigation', { name: 'Разделы' })
    .getByRole('link', { name: 'Профиль' })
    .click()
  await expect(page).toHaveURL('/settings')
  await seedWorkouts(user.uid, [
    {
      id: 'new',
      startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1),
      template: { ...warmUp, name: 'Разминка' },
      entries: [{ exerciseId: 'Pushups', sets: [{ reps: 10 }] }],
    },
  ])

  await page.evaluate(() => {
    const seen: string[] = ((window as unknown as { seen: string[] }).seen = [])
    new MutationObserver(() => {
      const title = document.getElementById('last-title')?.textContent
      if (title && seen.at(-1) !== title) seen.push(title)
    }).observe(document.body, { subtree: true, childList: true, characterData: true })
  })
  await page
    .getByRole('navigation', { name: 'Разделы' })
    .getByRole('link', { name: 'Сегодня' })
    .click()
  await expect(page.getByText('Последняя тренировка · Разминка')).toBeVisible()

  const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen)
  expect(seen).toEqual(['Последняя тренировка · Разминка'])
})
