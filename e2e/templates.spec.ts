import type { Locator, Page } from '@playwright/test'

import { expect, signIn, test } from './fixtures/auth'
import { firestoreDocuments } from './fixtures/emulators'
import { seedProfile, seedTemplates } from './fixtures/seed'

const user = { uid: 'builder', email: 'builder@example.com' }

const templatesUrl = `${firestoreDocuments}/users/${user.uid}/templates`

interface StoredEntry {
  exerciseId: string
  sets: number
}

interface StoredTemplate {
  id: string
  name: string
  copiedFrom: string | null
  entries: StoredEntry[]
}

interface RestFields {
  name: { stringValue: string }
  copiedFrom: { stringValue?: string }
  entries: {
    arrayValue: {
      values: {
        mapValue: {
          fields: { exerciseId: { stringValue: string }; sets: { integerValue: string } }
        }
      }[]
    }
  }
}

async function storedTemplates(): Promise<StoredTemplate[]> {
  const response = await fetch(templatesUrl, { headers: { Authorization: 'Bearer owner' } })
  const body = (await response.json()) as { documents?: { name: string; fields: RestFields }[] }

  return (body.documents ?? []).map(({ name, fields }) => ({
    id: name.split('/').at(-1) ?? '',
    name: fields.name.stringValue,
    copiedFrom: fields.copiedFrom.stringValue ?? null,
    entries: fields.entries.arrayValue.values.map(({ mapValue: { fields: entry } }) => ({
      exerciseId: entry.exerciseId.stringValue,
      sets: Number(entry.sets.integerValue),
    })),
  }))
}

async function open(page: Page, path: string) {
  await page.goto('/login')
  await signIn(page, user)
  await expect(page).toHaveURL('/')
  await page.goto(path)
}

const items = (page: Page) =>
  page.getByRole('list', { name: 'Упражнения набора' }).getByRole('listitem')

// The remove button names the exercise, which keeps the test independent of catalog names.
const itemName = async (page: Page, index: number) => {
  const label = await items(page)
    .nth(index)
    .getByRole('button', { name: /^Убрать/ })
    .getAttribute('aria-label')

  return label?.replace(/^Убрать «(.*)»$/, '$1') ?? ''
}

test('copy a ready-made set, edit it, save and start a workout from it', async ({ page }) => {
  // The longest flow of the suite; under parallel agents' load it outgrows the default 30 s.
  test.slow()
  const ready = 'Всё тело · A'
  await open(page, '/templates')

  await page.getByRole('button', { name: `Скопировать «${ready}» к себе` }).click()
  // A bare getByRole('status') also matches a page skeleton's "Загрузка" status region.
  await expect(page.getByRole('status').filter({ hasText: ready })).toHaveText(
    `«${ready}» теперь в ваших наборах`,
  )
  await expect(page.getByRole('button', { name: `«${ready}» уже скопирован` })).toBeDisabled()

  await page.getByRole('link', { name: `Изменить «${ready}»` }).click()
  await expect(page).toHaveURL(/\/templates\/[\w-]+$/)
  const id = page.url().split('/').at(-1) ?? ''
  await expect(page.getByRole('heading', { name: 'Редактор набора' })).toBeVisible()

  const [first, second] = [await itemName(page, 0), await itemName(page, 1)]
  const count = await items(page).count()

  // Moving down keeps the focus on the moved exercise's button.
  await page.getByRole('button', { name: `Ниже: ${first}` }).click()
  expect(await itemName(page, 0)).toBe(second)
  expect(await itemName(page, 1)).toBe(first)
  await expect(page.getByRole('button', { name: `Ниже: ${first}` })).toBeFocused()

  await page.getByRole('textbox', { name: `Подходы: ${second}` }).fill('5')

  await page.getByRole('button', { name: '+ Добавить упражнение' }).click()
  await page.getByRole('searchbox').fill('plank')
  const pick = page.getByRole('button', { name: /^Добавить «/ }).first()
  const added = ((await pick.getAttribute('aria-label')) ?? '').replace(/^Добавить «(.*)»$/, '$1')
  await pick.click()
  await page.keyboard.press('Escape')
  await expect(items(page)).toHaveCount(count + 1)
  expect(await itemName(page, count)).toBe(added)

  // An empty name is refused with a message and the focus on the field.
  const name = page.getByRole('textbox', { name: 'Название' })
  await name.fill('')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('alert')).toHaveText('Дайте набору название')
  await expect(name).toBeFocused()

  await name.fill('Мой дом')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page).toHaveURL('/templates')
  await expect(page.getByRole('link', { name: 'Изменить «Мой дом»' })).toBeVisible()

  await expect.poll(async () => (await storedTemplates())[0]?.name).toBe('Мой дом')
  const [stored] = await storedTemplates()
  expect(stored.id).toBe(id)
  expect(stored.copiedFrom).toBe('home-bodyweight')
  expect(stored.entries).toHaveLength(count + 1)
  expect(stored.entries[0].sets).toBe(5)

  await page.getByRole('button', { name: 'Начать «Мой дом»' }).click()
  await expect(page).toHaveURL('/session')
  const session = await page.evaluate(() => localStorage.getItem('personal-workout:session'))
  const { state } = JSON.parse(session ?? '{}') as {
    state: { workout: { template: unknown; entries: { exerciseId: string }[] } }
  }
  expect(state.workout.template).toEqual({ source: 'own', id, name: 'Мой дом' })
  expect(state.workout.entries.map((e) => e.exerciseId)).toEqual(
    stored.entries.map((e) => e.exerciseId),
  )
})

test('a new set takes an exercise from the catalog link and needs a name', async ({ page }) => {
  await open(page, '/templates/new?add=Pushups')

  await expect(page.getByRole('heading', { name: 'Новый набор' })).toBeVisible()
  await expect(items(page)).toHaveCount(1)
  await expect(page).toHaveURL('/templates/new')

  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('alert')).toHaveText('Дайте набору название')

  await page.getByRole('textbox', { name: 'Название' }).fill('Утро')
  await page.getByRole('button', { name: /^Убрать/ }).click()
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('alert')).toHaveText('Добавьте хотя бы одно упражнение')

  await page.getByRole('link', { name: 'Отмена' }).click()
  await expect(page).toHaveURL('/templates')
  expect(await storedTemplates()).toEqual([])
})

test('the place filter follows the home equipment and the schedule is marked', async ({ page }) => {
  await seedProfile(user.uid, {
    homeEquipment: ['dumbbell', 'pull-up bar'],
    schedule: {
      mon: [{ source: 'own', id: 'gym-own' }],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    },
  })
  await seedTemplates(user.uid, [
    {
      id: 'gym-own',
      name: 'Мой зал',
      entries: [{ exerciseId: 'Barbell_Squat', sets: 4, reps: 8, restSec: 120 }],
    },
  ])
  await open(page, '/templates')
  const mine = page.getByRole('region', { name: /Мои наборы/ })
  const ready = page.getByRole('region', { name: /Готовые наборы/ })
  // The first snapshot of a fresh emulator can take a while when several suites run at once.
  await expect(mine.getByText('по понедельникам')).toBeVisible({ timeout: 15_000 })
  await expect(ready.getByText('Всё тело · C')).toBeVisible()

  await page.getByRole('button', { name: 'Дома', exact: true }).click()
  await expect(page).toHaveURL('/templates?place=home')
  await expect(ready.getByText('Всё тело · B')).toBeVisible()
  await expect(ready.getByText('Всё тело · C')).toHaveCount(0)
  await expect(mine.getByText('У вас пока нет наборов для дома.', { exact: false })).toBeVisible()
})

test('an own set can be deleted from the editor', async ({ page }) => {
  await seedTemplates(user.uid, [
    {
      id: 't1',
      name: 'Растяжка дома',
      entries: [{ exerciseId: 'Cat_Stretch', sets: 2, durationSec: 30, restSec: 15 }],
    },
  ])
  await open(page, '/templates/t1')
  await expect(page.getByRole('textbox', { name: 'Название' })).toHaveValue('Растяжка дома')

  await page.getByRole('button', { name: 'Удалить набор' }).click()

  await expect(page).toHaveURL('/templates')
  await expect(page.getByRole('link', { name: 'Изменить «Растяжка дома»' })).toHaveCount(0)
  await expect.poll(storedTemplates).toEqual([])
})

test('a copied ready-made set can be deleted and copied again', async ({ page }, info) => {
  const ready = 'Всё тело · A'
  await open(page, '/templates')

  await page.getByRole('button', { name: `Скопировать «${ready}» к себе` }).click()
  await page.getByRole('link', { name: `Изменить «${ready}»` }).click()
  await expect(page.getByRole('textbox', { name: 'Название' })).toHaveValue(ready)

  const remove = page.getByRole('button', { name: 'Удалить набор' })
  if (info.project.name === 'mobile') await touch(page, remove, 1300)
  else await remove.click()

  await expect(page).toHaveURL('/templates')
  await expect(page.getByRole('link', { name: `Изменить «${ready}»` })).toHaveCount(0)
  await expect(page.getByRole('button', { name: `Скопировать «${ready}» к себе` })).toBeEnabled()
  await expect.poll(storedTemplates).toEqual([])
})

// A real touch through the DevTools protocol, so the page gets pointerType "touch".
async function touch(page: Page, target: Locator, holdMs: number) {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) throw new Error('Target is not visible')

  const cdp = await page.context().newCDPSession(page)
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const startUrl = page.url()

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
  await page.waitForTimeout(holdMs)
  // The hold's own action may already have navigated away (e.g. a delete-and-redirect); a touchend
  // dispatched at this fixed point would then land on whatever is on screen now, a stray tap a real
  // touchscreen never sends because its page is gone.
  if (page.url() === startUrl) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
}

test('start needs a hold on touch', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'a mouse click starts at once, covered above')
  await open(page, '/templates')
  const start = page.getByRole('button', { name: 'Начать «Растяжка»' })

  await touch(page, start, 100)
  await expect(start).toHaveText('Удерживайте')
  await expect(page).toHaveURL('/templates')

  await touch(page, start, 1300)
  await expect(page).toHaveURL('/session')
})

test('«Наверх» appears after scrolling and returns to the top', async ({ page }) => {
  // Own sets make the page long enough to scroll past the threshold at 1280×800 too.
  await seedTemplates(
    user.uid,
    Array.from({ length: 8 }, (_, i) => ({
      id: `long-${String(i)}`,
      name: `Набор ${String(i + 1)}`,
      entries: [{ exerciseId: 'Pushups', sets: 3, reps: 10, restSec: 60 }],
    })),
  )
  await open(page, '/templates')
  // Hidden, the button stays mounted but inert, out of focus and of the accessibility tree.
  const up = page.locator('[data-slot="scroll-top"]')
  await expect(page.getByRole('button', { name: 'Начать «Растяжка»' })).toBeVisible()
  await expect(up).toHaveAttribute('inert')

  await page.mouse.wheel(0, 2000)
  await expect(up).not.toHaveAttribute('inert')
  await page.getByRole('button', { name: 'Наверх' }).click()

  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await expect(up).toHaveAttribute('inert')
})
