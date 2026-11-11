import type { Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'
import { seedProfile, seedTemplates, seedWorkouts } from './fixtures/seed'

// T076: every route of contracts/routes.md fits a 360 px phone and uses the width at 1280 px.
const user = { uid: 'layout', email: 'layout@example.com' }
const gym = { source: 'ready', id: 'gym-full-body', name: 'Всё тело · C' } as const
const weekday = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[new Date().getDay()]
const emptyWeek = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }

const daysAgo = (n: number) => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 0, 1)
}

// Session routes start from the rest-day screen, so they seed no schedule.
async function seed(scheduled = true) {
  await seedProfile(user.uid, {
    homeEquipment: ['dumbbell', 'pull-up bar'],
    schedule: !scheduled
      ? emptyWeek
      : {
          ...emptyWeek,
          [weekday]: [
            { source: 'ready', id: 'warm-up' },
            { source: 'ready', id: gym.id },
          ],
        },
  })
  await seedTemplates(user.uid, [
    {
      id: 't1',
      name: 'Верх тела: длинное название, чтобы проверить перенос строк',
      entries: [
        { exerciseId: 'Pushups', sets: 3, reps: 12, restSec: 60 },
        { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: 4, reps: 8, restSec: 120 },
        { exerciseId: 'Plank', sets: 3, durationSec: 45, restSec: 45 },
      ],
    },
  ])
  await seedWorkouts(user.uid, [
    {
      id: 'w1',
      startedAt: daysAgo(7),
      template: gym,
      entries: [
        { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: [{ reps: 10, weightKg: 55 }] },
      ],
      survey: { bodyWeightKg: 81, wellbeing: 3, energy: 3 },
    },
    {
      id: 'w2',
      startedAt: daysAgo(1),
      template: gym,
      entries: [
        { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: [{ reps: 8, weightKg: 60 }] },
      ],
      survey: { bodyWeightKg: 80, wellbeing: 4, energy: 4 },
    },
  ])
}

async function signedIn(page: Page, scheduled = true) {
  await seed(scheduled)
  await page.goto('/login')
  await signIn(page, user)
  await expect(page).toHaveURL('/')
}

async function startSession(page: Page) {
  await signedIn(page, false)
  await page.getByRole('button', { name: 'Другая тренировка' }).click()
  await page.getByRole('button', { name: /Всё тело · C/ }).click()
  await expect(page).toHaveURL('/session')
}

interface Route {
  path: string
  /** Gets the page open; defaults to signing in with seeded data and going to `path`. */
  open?: (page: Page) => Promise<void>
  nav: boolean
  /** The prototype has a desktop layout, so content should be wider than 700 px at 1280. */
  desktop: boolean
}

const routes: Route[] = [
  {
    path: '/login',
    open: (page) => page.goto('/login').then(() => undefined),
    nav: false,
    desktop: false,
  },
  { path: '/', nav: true, desktop: true },
  { path: '/templates', nav: true, desktop: true },
  { path: '/templates/new', nav: true, desktop: true },
  { path: '/templates/t1', nav: true, desktop: true },
  { path: '/exercises', nav: true, desktop: true },
  { path: '/session', open: startSession, nav: false, desktop: true },
  {
    path: '/session/finish',
    open: async (page) => {
      await startSession(page)
      await page.getByRole('button', { name: 'Подход сделан' }).click()
      await page.getByRole('button', { name: 'Завершить' }).click()
      await expect(page).toHaveURL('/session/finish')
    },
    nav: false,
    desktop: true,
  },
  { path: '/stats', nav: true, desktop: true },
  { path: '/workouts/w2', nav: true, desktop: true },
  { path: '/settings', nav: true, desktop: true },
]

// Measured in the page: overflow, elements wider than the viewport, the widest block of the content.
const measure = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth
    const label = (e: Element) =>
      `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}.${(e.getAttribute('class') ?? '')
        .split(' ')
        .slice(0, 4)
        .join('.')} (${String(Math.round(e.getBoundingClientRect().width))}px)`
    const wide = [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().width > vw + 0.5)
      .slice(0, 5)
      .map(label)
    const blocks = [...document.querySelectorAll('main > *, main > * > *')]
    const content = Math.max(0, ...blocks.map((e) => e.getBoundingClientRect().width))

    return { vw, scrollWidth: document.documentElement.scrollWidth, wide, content }
  })

for (const route of routes) {
  test(`${route.path} fits the viewport`, async ({ page }, info) => {
    const phone = info.project.name === 'mobile'
    await page.setViewportSize(phone ? { width: 360, height: 640 } : { width: 1280, height: 800 })

    if (route.open) await route.open(page)
    else {
      await signedIn(page)
      await page.goto(route.path)
    }
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    // Lets charts, photos and fonts settle.
    await page.waitForTimeout(800)

    const m = await measure(page)
    expect.soft(m.scrollWidth, 'horizontal overflow').toBeLessThanOrEqual(m.vw)
    expect.soft(m.wide, 'elements wider than the viewport').toEqual([])
    await expect
      .soft(page.getByRole('navigation', { name: 'Разделы' }))
      .toHaveCount(route.nav ? 1 : 0)
    if (!phone && route.desktop) {
      expect.soft(m.content, 'content width at 1280').toBeGreaterThan(700)
    }
  })
}
