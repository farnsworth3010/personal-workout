import { expect, signIn, test } from './fixtures/auth'

const alice = { uid: 'alice', email: 'alice@example.com' }
const homeLabels = ['Гантели', 'Турник', 'Собственный вес']

// Quickstart scenario 5: home equipment drives the "home only" filter and the "зал" marks.
test('home equipment filters the catalog and marks gym exercises', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, alice)
  await expect(page).toHaveURL('/')

  await page.goto('/settings')
  for (const name of ['Гантели', 'Турник']) {
    const box = page.getByRole('checkbox', { name })
    await expect(box).toBeEnabled()
    // The box follows the profile cache, which TanStack Query updates a tick after the click.
    await box.click()
    await expect(box).toBeChecked()
  }

  await page.getByRole('link', { name: 'Упражнения' }).click()
  const rows = page.getByRole('region', { name: 'Каталог' }).getByRole('listitem')
  await expect(page.getByText(/^Показаны все \d+ упражнени/)).toBeVisible()
  await expect(rows.getByText('зал', { exact: true }).first()).toBeVisible()

  await page.getByRole('switch', { name: /Только для дома/ }).click()
  await expect(page).toHaveURL(/[?&]home/)
  await expect(page.getByText(/^Найдено: \d+ упражнени/)).toBeVisible()
  await expect(rows.getByText('зал', { exact: true })).toHaveCount(0)

  // Each row's last line is "<equipment> · <kind>".
  const equipment = await rows.locator('button > span > span:last-child').allTextContents()
  expect(equipment.length).toBeGreaterThan(0)
  for (const line of equipment) expect(homeLabels).toContain(line.split(' · ')[0])

  // The profile survives a reload and the filter is restored from the URL.
  await page.reload()
  await expect(page.getByRole('switch', { name: /Только для дома/ })).toBeChecked()
  await expect(page.getByText(/^Найдено: \d+ упражнени/)).toBeVisible()
  await expect(rows.getByText('зал', { exact: true })).toHaveCount(0)
})

test('an empty search offers a reset', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, alice)
  await expect(page).toHaveURL('/')

  await page.goto('/exercises?q=zzzz')
  await expect(page.getByText('Ничего не найдено')).toBeVisible()

  await page.getByRole('button', { name: 'Сбросить поиск и фильтры' }).click()

  await expect(page).toHaveURL('/exercises')
  await expect(page.getByText(/^Показаны все \d+ упражнени/)).toBeVisible()
})
