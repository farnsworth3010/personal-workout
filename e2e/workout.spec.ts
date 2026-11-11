import { expect, signIn, test } from './fixtures/auth'
import { seedWorkouts } from './fixtures/seed'

const user = { uid: 'workout', email: 'workout@example.com' }
const gym = { source: 'ready', id: 'gym-full-body', name: 'Всё тело · C' } as const
const bench = 'Barbell_Bench_Press_-_Medium_Grip'

// Just after midnight, so the dates hold whenever the test runs.
const daysAgo = (n: number) => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 0, 1)
}

test('a stats calendar day opens the finished workout with its sets and survey', async ({
  page,
}) => {
  await seedWorkouts(user.uid, [
    {
      id: 'before',
      startedAt: daysAgo(7),
      template: gym,
      entries: [{ exerciseId: bench, sets: [{ reps: 10, weightKg: 55 }] }],
      survey: { bodyWeightKg: 82.4 },
    },
    {
      id: 'today',
      startedAt: daysAgo(0),
      template: gym,
      entries: [
        {
          exerciseId: bench,
          sets: [
            { reps: 10, weightKg: 60 },
            { reps: 8, weightKg: 62.5 },
          ],
        },
        { exerciseId: 'Plank', sets: [{ durationSec: 60 }] },
      ],
      survey: { wellbeing: 4, energy: 3, bodyWeightKg: 82.1 },
    },
  ])
  await page.goto('/login')
  await signIn(page, user)
  await page.goto('/stats')

  const today = new Date()
  await page
    .getByRole('link', { name: new RegExp(`^${today.getDate()} \\S+: Всё тело · C$`) })
    .click()

  await expect(page).toHaveURL('/workouts/today')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Всё тело · C')
  await expect(page.getByRole('navigation', { name: 'Разделы' })).toBeVisible()
  const sets = page.getByRole('list', { name: /^Подходы: Barbell Bench Press/ })
  await expect(sets.getByRole('listitem')).toHaveCount(2)
  await expect(sets.getByRole('listitem').first()).toContainText('10 × 60 кг')
  await expect(page.getByText('60 с')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Самочувствие: 4 из 5' })).toBeVisible()
  await expect(page.getByText('−0,3 кг к прошлому разу')).toBeVisible()

  await page.getByRole('button', { name: '‹ Назад' }).click()
  await expect(page).toHaveURL('/stats')
})

test('an unknown workout id says it is not found', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, user)
  await page.goto('/workouts/nope')

  await expect(page.getByText('Тренировка не найдена')).toBeVisible()
})
