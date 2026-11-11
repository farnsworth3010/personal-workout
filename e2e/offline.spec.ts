import type { Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'
import { firestoreDocuments } from './fixtures/emulators'

// Runs in the 'offline' project: a production build with the service worker, see README "Offline e2e".

const user = { uid: 'offline', email: 'offline@example.com' }
const userDoc = `${firestoreDocuments}/users/${user.uid}`

interface RestValue {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  nullValue?: null
  timestampValue?: string
  arrayValue?: { values?: RestValue[] }
  mapValue?: { fields?: Record<string, RestValue> }
}

// Firestore REST values to plain JSON; timestamps stay ISO strings.
const decode = (value: RestValue): unknown => {
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decode)
  if (value.mapValue) return decodeFields(value.mapValue.fields ?? {})
  if (value.integerValue !== undefined) return Number(value.integerValue)

  return (
    value.doubleValue ??
    value.stringValue ??
    value.booleanValue ??
    value.timestampValue ??
    value.nullValue
  )
}

const decodeFields = (fields: Record<string, RestValue>) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decode(value)]))

// Owner reads of the emulator, bypassing rules; undefined while a document does not exist.
async function read<T>(path: string): Promise<T | undefined> {
  const response = await fetch(`${userDoc}${path}`, { headers: { Authorization: 'Bearer owner' } })
  if (!response.ok) return undefined

  const body = (await response.json()) as { fields?: Record<string, RestValue> }

  return decodeFields(body.fields ?? {}) as T
}

async function readAll<T>(path: string): Promise<(T & { id: string })[]> {
  const response = await fetch(`${userDoc}${path}`, { headers: { Authorization: 'Bearer owner' } })
  const body = (await response.json()) as {
    documents?: { name: string; fields: Record<string, RestValue> }[]
  }

  return (body.documents ?? []).map((doc) => ({
    ...(decodeFields(doc.fields) as T),
    id: doc.name.split('/').at(-1) ?? '',
  }))
}

interface Profile {
  homeEquipment: string[]
  activeWorkoutId: string | null
}

interface Workout {
  status: string
  entries: { exerciseId: string; status: string; sets: { reps?: number; weightKg?: number }[] }[]
  survey: Record<string, number>
}

interface ExerciseStats {
  lastWorkoutId: string
  lastSets: { reps?: number; weightKg?: number }[]
}

// Signs in and reloads once, so the freshly installed service worker controls the page.
async function signInWithWorker(page: Page) {
  await page.goto('/login')
  await signIn(page, user)
  await expect(page).toHaveURL('/')

  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
}

const heading = (page: Page) => page.getByRole('heading', { level: 1 })

async function doSet(page: Page, weight?: string) {
  await page.getByRole('button', { name: 'Подход сделан' }).click()

  if (weight)
    await page
      .getByRole('group', { name: 'Вес, кг' })
      .getByRole('button', { name: weight, exact: true })
      .click()

  await page.getByRole('button', { name: 'Следующий подход' }).click()
}

// US7: the app starts offline from the cache, keeps working, and syncs a change made offline.
test('starts offline and syncs a change made offline', async ({ page, context }) => {
  await signInWithWorker(page)

  // Seen online once, so Firestore has the profile in its local cache.
  await page.goto('/settings')
  await expect(page.getByRole('checkbox', { name: 'Гантели' })).toBeEnabled()

  await context.setOffline(true)

  await page.reload()
  await expect(heading(page)).toHaveText('Профиль')
  const strip = page.getByRole('status').filter({ hasText: /^Офлайн/ })
  await expect(strip).toBeVisible()

  await page.goto('/exercises')
  await expect(page.getByText(/^Показаны все \d+ упражнени/)).toBeVisible()

  await page.goto('/settings')
  const dumbbells = page.getByRole('checkbox', { name: 'Гантели' })
  await expect(dumbbells).toBeEnabled()
  // click, not check(): the box follows the profile cache a tick later, so check() may see no change.
  await dumbbells.click()
  await expect(dumbbells).toBeChecked()
  expect((await read<Profile>(''))?.homeEquipment).not.toContain('dumbbell')

  await context.setOffline(false)
  await expect(strip).toBeHidden()

  await expect
    .poll(async () => (await read<Profile>(''))?.homeEquipment, { timeout: 15_000 })
    .toContain('dumbbell')
})

// Constitution: a workout is never interrupted, not by the network and not by a reload.
test('a workout started online runs, survives a reload and finishes offline', async ({
  page,
  context,
}) => {
  await signInWithWorker(page)

  await page.getByRole('button', { name: /^(Начать тренировку|Другая тренировка)$/ }).click()
  await page.getByRole('button', { name: /Всё тело · C/ }).click()
  await expect(page).toHaveURL('/session')
  await expect(heading(page)).toHaveText('Barbell Squat')
  await expect.poll(async () => (await read<Profile>(''))?.activeWorkoutId).toBeTruthy()

  await context.setOffline(true)

  await doSet(page, '60')
  await doSet(page)
  await doSet(page)
  await expect(heading(page)).toHaveText('Barbell Bench Press - Medium Grip')
  await page.getByRole('button', { name: 'Подход сделан' }).click()
  await expect(page.getByText('Отдых после подхода 1')).toBeVisible()

  await page.reload()

  await expect(heading(page)).toHaveText('Barbell Bench Press - Medium Grip')
  await expect(page.getByText('Отдых после подхода 1')).toBeVisible()
  await page.getByRole('button', { name: 'Следующий подход' }).click()

  await page.getByRole('button', { name: 'Завершить' }).click()
  await expect(page).toHaveURL('/session/finish')
  await page.getByRole('group', { name: 'Самочувствие' }).getByRole('button', { name: '4' }).click()
  await page.getByRole('group', { name: 'Энергия' }).getByRole('button', { name: '3' }).click()
  await page.getByRole('button', { name: 'Сохранить тренировку' }).click()
  await expect(page).toHaveURL('/')

  // Nothing reached the server while offline.
  expect((await readAll<Workout>('/workouts')).map((w) => w.status)).toEqual(['active'])

  await context.setOffline(false)

  await expect
    .poll(async () => (await readAll<Workout>('/workouts')).map((w) => w.status), {
      timeout: 15_000,
    })
    .toEqual(['done'])

  const workout = (await readAll<Workout>('/workouts')).at(0)
  const byId = (id: string) => workout?.entries.find((entry) => entry.exerciseId === id)

  expect(byId('Barbell_Squat')).toMatchObject({
    status: 'done',
    sets: [
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
    ],
  })
  expect(byId('Barbell_Bench_Press_-_Medium_Grip')?.sets).toHaveLength(1)
  expect(workout?.survey).toEqual({ wellbeing: 4, energy: 3 })

  await expect
    .poll(async () => (await read<ExerciseStats>('/exerciseStats/Barbell_Squat'))?.lastWorkoutId)
    .toBe(workout?.id)
  expect((await read<ExerciseStats>('/exerciseStats/Barbell_Squat'))?.lastSets).toHaveLength(3)
  await expect.poll(async () => (await read<Profile>(''))?.activeWorkoutId).toBeNull()
})
