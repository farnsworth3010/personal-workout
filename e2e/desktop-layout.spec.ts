import { expect, signIn, test } from './fixtures/auth'
import { seedProfile } from './fixtures/seed'

// Classic scrollbars, as in the owner's desktop browser; Playwright hides them by default.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

const destinations = ['/', '/templates', '/exercises', '/stats', '/settings'].map((path) => ({
  path,
}))

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the sidebar and two columns are desktop only')
  await page.goto('/login')
  await signIn(page, { uid: 'desktop', email: 'desktop@example.com' })
  await expect(page).toHaveURL('/')
})

test('the sidebar, logo and content edge stay put on every section', async ({ page }) => {
  const boxes = []
  for (const { path } of destinations) {
    await page.goto(path)
    await expect(page.getByRole('main')).not.toContainText('Загрузка')

    boxes.push(
      await page.evaluate(() => {
        const box = (el: Element | null) => {
          const r = el?.getBoundingClientRect()
          return r && [r.x, r.y, r.width, r.height]
        }
        return {
          nav: box(document.querySelector('[data-app-nav]')),
          logo: box(document.querySelector('[data-app-nav] a')),
          links: [...document.querySelectorAll('[data-app-nav] a')].map(box),
          content: document.documentElement.clientWidth,
          h1: box(document.querySelector('h1'))?.[0],
        }
      }),
    )
  }

  for (const [i, box] of boxes.entries()) expect(box, destinations[i].path).toEqual(boxes[0])
})

test('Today keeps the week in view while the sets scroll', async ({ page }) => {
  // Two sets today, so the open one's exercise list makes the left column long.
  const weekday = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[new Date().getDay()]
  const ready = (id: string) => ({ source: 'ready', id }) as const
  await seedProfile('desktop', {
    schedule: {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
      [weekday]: [ready('warm-up'), ready('back-care')],
    },
  })
  await page.setViewportSize({ width: 1280, height: 500 })
  await page.goto('/')
  const week = page.getByText(/^Неделя ·/)
  await expect(week).toBeVisible()

  // It rises to the top offset with the page, then stays while the left column keeps scrolling.
  await page.mouse.wheel(0, 300)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
  const stuck = (await week.boundingBox())?.y
  const scrolled = await page.evaluate(() => scrollY)

  await page.mouse.wheel(0, 300)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrolled)

  expect((await week.boundingBox())?.y).toBe(stuck)
})
