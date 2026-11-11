import type { Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'
import { seedWorkouts } from './fixtures/seed'

const user = { uid: 'stats', email: 'stats@example.com' }
const gym = { source: 'ready', id: 'gym-full-body', name: 'Всё тело · C' } as const
const bench = 'Barbell_Bench_Press_-_Medium_Grip'

// Just after midnight, so the dates hold whenever the test runs.
const daysAgo = (n: number) => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 0, 1)
}

async function open(page: Page) {
  await page.goto('/login')
  await signIn(page, user)
  await page.goto('/stats')
  await expect(page.getByRole('heading', { name: 'Статистика' })).toBeVisible()
}

// spec.md User Story 6, independent test: workouts across two weeks, checked against the charts.
test('shows week load, untrained muscles, calendar, records and body charts', async ({ page }) => {
  await seedWorkouts(user.uid, [
    {
      // Long ago, so total time proves the whole history is loaded.
      id: 'last-year',
      startedAt: daysAgo(400),
      endedAt: new Date(daysAgo(400).getTime() + 195 * 60_000),
      template: gym,
      entries: [{ exerciseId: bench, sets: [{ reps: 10, weightKg: 50 }] }],
    },
    {
      id: 'last-week',
      startedAt: daysAgo(7),
      template: gym,
      entries: [
        {
          exerciseId: bench,
          sets: [
            { reps: 10, weightKg: 55 },
            { reps: 10, weightKg: 55 },
          ],
        },
      ],
      survey: { bodyWeightKg: 81, wellbeing: 3, energy: 3 },
    },
    {
      id: 'today',
      startedAt: daysAgo(0),
      template: gym,
      entries: [
        {
          exerciseId: bench,
          sets: [
            { reps: 8, weightKg: 60 },
            { reps: 8, weightKg: 60 },
            { reps: 6, weightKg: 62.5 },
          ],
        },
      ],
      survey: { bodyWeightKg: 80, wellbeing: 4, energy: 3 },
    },
  ])
  await open(page)

  // Only today's workout is in this week: 3 sets with chest as the primary muscle.
  await expect(page.getByText(/· 1 тренировка$/)).toBeVisible()
  await page.getByRole('button', { name: 'Грудь: 3 подхода' }).click()
  await expect(page.getByText('лёгкая нагрузка')).toBeVisible()
  await expect(page.getByRole('listitem').getByRole('button', { name: 'Икры' })).toBeVisible()

  const today = new Date()
  await expect(
    page.getByRole('link', { name: new RegExp(`^${today.getDate()} \\S+: Всё тело · C$`) }),
  ).toBeVisible()
  await expect(page.getByText('На этой неделе', { exact: true }).locator('xpath=..')).toContainText(
    '1',
  )

  // 45 + 45 + 195 minutes.
  await expect(page.getByText('Всего времени', { exact: true }).locator('xpath=..')).toContainText(
    '5 ч',
  )

  await expect(page.getByRole('combobox', { name: 'Упражнение' })).toHaveValue(bench)
  await expect(page.getByText('Макс. вес', { exact: true }).locator('xpath=..')).toContainText(
    '62,5 кг',
  )
  await expect(page.getByText('Лучший подход', { exact: true }).locator('xpath=..')).toContainText(
    '8 × 60',
  )

  await expect(page.getByRole('img', { name: 'График веса тела' })).toBeVisible()
  await expect(page.getByText('последнее: 80 кг')).toBeVisible()
  await expect(page.getByRole('img', { name: 'График самочувствия и энергии' })).toBeVisible()
})

test('explains every section before the first workout', async ({ page }) => {
  await open(page)

  await expect(page.getByText(/· 0 тренировок$/)).toBeVisible()
  await expect(page.getByText(/тренировок ещё не было/)).toBeVisible()
  await expect(page.getByText(/отметятся в календаре/)).toBeVisible()
  await expect(page.getByText(/появятся график веса, объёма и повторов/)).toBeVisible()
  await expect(page.getByText(/Вес тела появится/)).toBeVisible()
})
