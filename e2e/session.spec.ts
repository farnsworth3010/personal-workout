import type { Locator, Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'
import { firestoreDocuments } from './fixtures/emulators'

const user = { uid: 'runner', email: 'runner@example.com' }

const workoutsUrl = `${firestoreDocuments}/users/${user.uid}/workouts`

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

interface SavedWorkout {
  status: string
  entries: { exerciseId: string; status: string; sets: { reps?: number; weightKg?: number }[] }[]
  survey: Record<string, number>
}

async function savedWorkouts(): Promise<SavedWorkout[]> {
  const response = await fetch(workoutsUrl, { headers: { Authorization: 'Bearer owner' } })
  const body = (await response.json()) as { documents?: { fields: Record<string, RestValue> }[] }

  return (body.documents ?? []).map((doc) => decodeFields(doc.fields) as unknown as SavedWorkout)
}

async function startWorkout(page: Page) {
  await page.goto('/login')
  await signIn(page, user)
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: /^(Начать тренировку|Другая тренировка)$/ }).click()
  await page.getByRole('button', { name: /Всё тело · C/ }).click()
  await expect(page).toHaveURL('/session')
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

// Past the 1 s hold with room for a loaded machine, where the hold timer fires late.
const LONG_HOLD = 1600

// A real touch through the DevTools protocol, so the page gets pointerType "touch".
async function touch(page: Page, target: Locator, holdMs: number) {
  const box = await target.boundingBox()

  if (!box) throw new Error('Target is not visible')

  const cdp = await page.context().newCDPSession(page)
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
  await page.waitForTimeout(holdMs)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

test('a workout keeps every set, the postponed exercise and the survey', async ({ page }) => {
  await startWorkout(page)
  await expect(heading(page)).toHaveText('Barbell Squat')

  await doSet(page, '60')
  await expect(page.getByText('8 × 60')).toBeVisible()
  await doSet(page)
  await doSet(page)

  await expect(heading(page)).toHaveText('Barbell Bench Press - Medium Grip')
  await page.getByRole('button', { name: 'Пропустить →' }).click()
  await expect(heading(page)).toHaveText('Wide-Grip Lat Pulldown')
  await expect(page.getByRole('button', { name: /Отложено: 1/ })).toBeVisible()

  await page.getByRole('button', { name: '+ Упражнение' }).click()
  await page.getByRole('searchbox').fill('plank')
  await page.getByRole('button', { name: 'Добавить «Plank»' }).click()
  await page.getByRole('button', { name: 'Следующим' }).click()
  await expect(heading(page)).toHaveText('Wide-Grip Lat Pulldown')

  await page.getByRole('button', { name: /Отложено: 1/ }).click()
  await page.getByRole('button', { name: 'Вернуться' }).click()
  await expect(heading(page)).toHaveText('Barbell Bench Press - Medium Grip')
  await doSet(page)
  await doSet(page)
  await doSet(page)

  await expect(heading(page)).toHaveText('Wide-Grip Lat Pulldown')
  await page.getByRole('button', { name: 'Завершить' }).click()
  await expect(page).toHaveURL('/session/finish')

  await page.getByRole('group', { name: 'Самочувствие' }).getByRole('button', { name: '4' }).click()
  await page.getByRole('group', { name: 'Энергия' }).getByRole('button', { name: '3' }).click()
  await page.getByRole('button', { name: 'Сохранить тренировку' }).click()
  await expect(page).toHaveURL('/')

  await expect.poll(async () => (await savedWorkouts())[0]?.status).toBe('done')

  const workout = (await savedWorkouts()).at(0)
  const byId = (id: string) => workout?.entries.find((entry) => entry.exerciseId === id)

  expect(workout?.entries.map((entry) => entry.exerciseId).slice(0, 4)).toEqual([
    'Barbell_Squat',
    'Barbell_Bench_Press_-_Medium_Grip',
    'Wide-Grip_Lat_Pulldown',
    'Plank',
  ])
  expect(byId('Barbell_Squat')).toMatchObject({
    status: 'done',
    sets: [
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
    ],
  })
  expect(byId('Barbell_Bench_Press_-_Medium_Grip')).toMatchObject({ status: 'done' })
  expect(byId('Barbell_Bench_Press_-_Medium_Grip')?.sets).toHaveLength(3)
  expect(byId('Wide-Grip_Lat_Pulldown')).toMatchObject({ status: 'skipped', sets: [] })
  expect(byId('Plank')).toMatchObject({ status: 'skipped', sets: [] })
  expect(workout?.survey).toEqual({ wellbeing: 4, energy: 3 })
})

test('a reload during rest returns to the same set with the real countdown', async ({ page }) => {
  await startWorkout(page)
  await page.getByRole('button', { name: 'Подход сделан' }).click()
  await expect(page.getByText('Отдых после подхода 1')).toBeVisible()
  await page.waitForTimeout(3000)

  await page.reload()

  await expect(heading(page)).toHaveText('Barbell Squat')
  await expect(page.getByText('Отдых после подхода 1')).toBeVisible()

  const [minutes = 0, seconds = 0] = (await page.getByTestId('rest-countdown').innerText())
    .split(':')
    .map(Number)

  expect(minutes * 60 + seconds).toBeLessThanOrEqual(117)
  expect(minutes * 60 + seconds).toBeGreaterThan(100)

  await page.goto('/')
  await page.getByRole('link', { name: 'Продолжить тренировку' }).click()
  await expect(page.getByText('Отдых после подхода 1')).toBeVisible()
})

test('back, skip and finish need a hold on touch and a click with a mouse', async ({
  page,
}, info) => {
  await startWorkout(page)
  await doSet(page)

  const skip = page.getByRole('button', { name: 'Пропустить →' })

  if (info.project.name === 'desktop') {
    await page.getByRole('button', { name: '← Назад' }).click()
    await expect(page.getByText('1 / 3')).toBeVisible()

    await skip.click()
    await expect(heading(page)).toHaveText('Barbell Bench Press - Medium Grip')

    await page.getByRole('button', { name: 'Завершить' }).click()
    await expect(page).toHaveURL('/session/finish')

    return
  }

  const back = page.getByRole('button', { name: '← Назад' })
  const finish = page.getByRole('button', { name: 'Завершить' })

  // The hint replaces the label, and with it the accessible name, for a moment.
  const hint = page.getByRole('button', { name: 'Удерживайте' })

  const done = page.getByRole('button', { name: 'Подход сделан' })

  for (const target of [back, skip, finish, done]) {
    await touch(page, target, 150)
    await expect(hint).toBeVisible()
    await expect(hint).toHaveCount(0)
  }

  await expect(page).toHaveURL('/session')
  await expect(heading(page)).toHaveText('Barbell Squat')
  await expect(page.getByText('2 / 3')).toBeVisible()

  await touch(page, done, LONG_HOLD)
  await expect(page.getByText('Отдых после подхода 2')).toBeVisible()

  const next = page.getByRole('button', { name: 'Следующий подход' })

  await touch(page, next, 150)
  await expect(hint).toBeVisible()
  await expect(hint).toHaveCount(0)
  await expect(page.getByText('Отдых после подхода 2')).toBeVisible()
  await touch(page, next, LONG_HOLD)
  await expect(page.getByText('3 / 3')).toBeVisible()

  await touch(page, back, LONG_HOLD)
  await expect(page.getByText('2 / 3')).toBeVisible()

  await touch(page, back, LONG_HOLD)
  await expect(page.getByText('1 / 3')).toBeVisible()

  await touch(page, skip, LONG_HOLD)
  await expect(heading(page)).toHaveText('Barbell Bench Press - Medium Grip')

  await touch(page, finish, LONG_HOLD)
  await expect(page).toHaveURL('/session/finish')
})
