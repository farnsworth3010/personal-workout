import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { catalogQuery, type Exercise } from '@/entities/exercise'
import { defaultProfile, type ProfilePatch } from '@/entities/profile'
import { useSessionStore, type NewEntry } from '@/entities/session'
import { readyTemplatesQuery, type ReadyTemplate, type TemplateRef } from '@/entities/template'
import { createQueryClient, type Profile, type WithId, type Workout } from '@/shared/api'

import { usePlaceStore } from '../../model/place'
import { TodayPage } from './today-page'

const mocks = vi.hoisted(() => ({
  profile: undefined as Profile | undefined,
  update: vi.fn<(patch: ProfilePatch) => void>(),
  history: [] as unknown[],
  active: null as WithId<Workout> | null,
}))
vi.mock('@/entities/profile', async (load) => ({
  ...(await load<typeof import('@/entities/profile')>()),
  useProfile: () => ({ profile: mocks.profile, update: mocks.update }),
}))
vi.mock('@/entities/workout', () => ({
  useWorkoutHistory: () => mocks.history,
  useActiveWorkout: () => mocks.active,
}))
// useTemplateList reads own sets through this module, not through the public API.
vi.mock('@/entities/template/api/own-templates', async (load) => ({
  ...(await load<typeof import('@/entities/template/api/own-templates')>()),
  useOwnTemplates: () => ({ data: [] }),
}))

const exercise = (id: string, equipment: Exercise['equipment']): Exercise => ({
  id,
  name: id,
  kind: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment,
  instructions: [],
  images: [],
})

const entry = (exerciseId: string) => ({
  id: exerciseId,
  exerciseId,
  sets: 3,
  reps: 10,
  restSec: 60,
})

const ready: ReadyTemplate[] = [
  { id: 'warmup', name: 'Разминка', place: 'home', entries: [entry('Pushups')] },
  { id: 'back', name: 'Спина', place: 'gym', pairId: 'b', entries: [entry('Bench')] },
  { id: 'back-home', name: 'Спина дома', place: 'home', pairId: 'b', entries: [entry('Pushups')] },
  { id: 'stretch', name: 'Растяжка', place: 'home', entries: [entry('Pushups')] },
]

const ref = (id: string): TemplateRef => ({ source: 'ready', id })

// Wednesday 11 November 2026, noon.
const NOW = new Date(2026, 10, 11, 12)
const at = (h: number, m: number) => Timestamp.fromDate(new Date(2026, 10, 11, h, m))

const warmupDone: WithId<Workout> = {
  id: 'w-warmup',
  status: 'done',
  startedAt: at(7, 0),
  endedAt: at(7, 15),
  template: { source: 'ready', id: 'warmup', name: 'Разминка' },
  entries: [],
  survey: {},
  summary: { durationSec: 900, volumeKg: 0, setsDone: 3, muscleSets: {} },
  updatedAt: at(7, 15),
}

function seed(wed: TemplateRef[], workouts: Workout[] = [warmupDone]) {
  const profile: Profile = {
    ...defaultProfile,
    schedule: { ...defaultProfile.schedule, wed, fri: [ref('back')] },
  }
  mocks.profile = profile
  mocks.history = workouts
}

function renderToday() {
  const client = createQueryClient()
  client.setQueryData(catalogQuery.queryKey, [
    exercise('Pushups', 'body only'),
    exercise('Bench', 'barbell'),
  ])
  client.setQueryData(readyTemplatesQuery.queryKey, ready)

  const router = createMemoryRouter([
    {
      path: '/',
      element: <TodayPage user={{ uid: 'u1', displayName: null, email: null, photoURL: null }} />,
    },
    { path: '/session', element: <p>session page</p> },
    { path: '/session/finish', element: <p>finish page</p> },
  ])
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return router
}

const ENTRY: NewEntry[] = [
  { exerciseId: 'A', name: 'A', kind: 'strength', plan: { sets: 1, reps: 5, restSec: 60 } },
]

const lastPatch = () => mocks.update.mock.lastCall?.[0]
const lastSchedule = () => lastPatch()?.schedule

describe('TodayPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    vi.clearAllMocks()
    mocks.active = null
    useSessionStore.getState().discard()
    usePlaceStore.setState({ place: null })
  })

  afterEach(() => vi.useRealTimers())

  it('shows a loading status with the real header until the profile has loaded', () => {
    mocks.profile = undefined
    renderToday()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Сегодня' })).toBeInTheDocument()
  })

  it("lists today's sets in order with the done one, the open one and a waiting one", () => {
    seed([ref('warmup'), ref('back'), ref('stretch')])
    renderToday()

    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
    expect(screen.getByText(/среда · сделано 1 из 3/)).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Наборы на сегодня' })
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Разминка')
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Сделано в ✓ 07:15')
    expect(within(list).getByRole('link', { name: /Сделано в\s*07:15/ })).toHaveAttribute(
      'href',
      '/workouts/w-warmup',
    )
    expect(
      within(list).getByRole('button', { name: /Спина дома/, expanded: true }),
    ).toBeInTheDocument()
    expect(
      within(list).getByRole('list', { name: 'Упражнения набора «Спина дома»' }),
    ).toHaveTextContent('3 × 10')
    expect(
      within(list).getByRole('button', { name: /Растяжка/, expanded: false }),
    ).toBeInTheDocument()
    expect(within(list).getAllByRole('button', { name: 'Начать' })).toHaveLength(1)

    expect(screen.getByText('Последняя тренировка · Разминка')).toBeInTheDocument()
    const wed = screen.getByRole('button', { current: 'date' })
    expect(wed).toHaveTextContent('Разминка · Спина дома · Растяжка')
    expect(wed).toHaveTextContent('1 из 3')
  })

  it("filters today's sets by the header place, a pair as its variant", async () => {
    seed([ref('warmup'), ref('back')])
    renderToday()

    expect(screen.getByRole('button', { name: 'Дома' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Спина дома/, expanded: true })).toHaveTextContent(
      'вариант для дома',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Зал' }))

    const list = screen.getByRole('list', { name: 'Наборы на сегодня' })
    expect(within(list).queryByText('Разминка')).not.toBeInTheDocument()
    expect(
      within(list).getByRole('button', { name: /Спина/, expanded: true }),
    ).not.toHaveTextContent('вариант')
    expect(screen.getByRole('button', { current: 'date' })).toHaveTextContent(/^Ср11Спина/)
  })

  it('counts the finished home variant as the planned set', () => {
    seed(
      [ref('warmup'), ref('back')],
      [
        warmupDone,
        {
          ...warmupDone,
          startedAt: at(9, 0),
          endedAt: at(9, 40),
          template: { source: 'ready', id: 'back-home', name: 'Спина дома' },
        },
      ],
    )
    renderToday()

    expect(screen.getByText(/сделано 2 из 2/)).toBeInTheDocument()
    expect(screen.getByText(/Все наборы на сегодня сделаны/)).toBeInTheDocument()
  })

  it('skips a planned own set that was deleted', () => {
    seed([{ source: 'own', id: 'deleted' }, ref('back')], [])
    renderToday()

    expect(screen.getByText(/сделано 0 из 1/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Спина/, expanded: true })).toBeInTheDocument()
    expect(screen.queryByText('Набор удалён')).not.toBeInTheDocument()
  })

  it('starts another set for today without changing the schedule', async () => {
    seed([ref('warmup'), ref('back')])
    const router = renderToday()

    await userEvent.click(screen.getByRole('button', { name: 'Другая тренировка' }))
    const sheet = screen.getByRole('dialog', { name: 'Другая тренировка' })
    expect(within(sheet).getByRole('button', { name: /Спина дома/ })).toHaveTextContent('По плану')
    await userEvent.click(within(sheet).getByRole('button', { name: /Растяжка/ }))

    expect(router.state.location.pathname).toBe('/session')
    expect(useSessionStore.getState().workout?.template.id).toBe('stretch')
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('starts a set on touch only after a one-second hold (FR-045)', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    vi.setSystemTime(NOW)
    seed([ref('warmup'), ref('back'), ref('stretch')])
    const router = renderToday()
    const start = screen.getByRole('button', { name: 'Начать' })

    fireEvent.pointerDown(start, { pointerType: 'touch' })
    fireEvent.pointerUp(start, { pointerType: 'touch' })
    expect(start).toHaveTextContent('Удерживайте')
    expect(useSessionStore.getState().workout).toBeNull()

    fireEvent.pointerDown(start, { pointerType: 'touch' })
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(router.state.location.pathname).toBe('/session')
    expect(useSessionStore.getState().workout?.template.id).toBe('stretch')
  })

  it('says when every set of the day is done', () => {
    seed([ref('warmup')])
    renderToday()

    expect(screen.getByText(/Все наборы на сегодня сделаны/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Другая тренировка' })).toBeInTheDocument()
  })

  it('shows a rest day with the next planned workout', () => {
    seed([], [])
    renderToday()

    expect(screen.getByRole('heading', { name: 'День отдыха' })).toBeInTheDocument()
    expect(screen.getByText('Следующая по плану — пятница: Спина')).toBeInTheDocument()
  })

  it('starts a waiting set, and asks first while another workout runs', async () => {
    seed([ref('warmup'), ref('back'), ref('stretch')])
    const router = renderToday()

    useSessionStore.getState().start({ source: 'ready', id: 'x', name: 'Утро' }, ENTRY)
    await userEvent.click(await screen.findByRole('button', { name: 'Начать' }))
    expect(screen.getByRole('dialog', { name: 'Уже идёт тренировка' })).toBeInTheDocument()

    useSessionStore.getState().discard()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Начать' }))

    expect(router.state.location.pathname).toBe('/session')
    expect(useSessionStore.getState().workout?.template).toEqual({
      source: 'ready',
      id: 'stretch',
      name: 'Растяжка',
    })
  })

  it('leads an ended, unsaved workout to its summary instead of starting over it', async () => {
    seed([ref('warmup'), ref('back'), ref('stretch')])
    const router = renderToday()

    useSessionStore.getState().start({ source: 'ready', id: 'x', name: 'Утро' }, ENTRY)
    useSessionStore.getState().end()
    await userEvent.click(await screen.findByRole('button', { name: 'Начать' }))

    expect(screen.getByRole('dialog', { name: 'Тренировка не сохранена' })).toBeInTheDocument()
    expect(useSessionStore.getState().workout?.template.id).toBe('x')

    await userEvent.click(screen.getByRole('link', { name: 'К итогам тренировки' }))
    expect(router.state.location.pathname).toBe('/session/finish')
  })

  it('offers to continue a workout the server still holds as active', async () => {
    seed([ref('warmup')])
    mocks.active = {
      id: 'w-lost',
      status: 'active',
      startedAt: Timestamp.fromDate(NOW),
      endedAt: null,
      template: { source: 'ready', id: 'x', name: 'Утро' },
      entries: [
        {
          id: 'e1',
          exerciseId: 'A',
          name: 'A',
          kind: 'strength',
          plan: { sets: 1, reps: 5, restSec: 60 },
          status: 'pending',
          sets: [],
        },
      ],
      survey: {},
      summary: null,
      updatedAt: Timestamp.fromDate(NOW),
    }
    const router = renderToday()

    expect(screen.getByRole('heading', { name: 'Утро' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

    expect(router.state.location.pathname).toBe('/session')
    expect(useSessionStore.getState().workoutId).toBe('w-lost')
  })

  it("edits a weekday's list and saves the whole schedule", async () => {
    seed([ref('warmup'), ref('back')])
    renderToday()

    await userEvent.click(screen.getByRole('button', { current: 'date' }))
    const dialog = screen.getByRole('dialog', { name: 'Среда, 11 ноября' })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Выше: Спина' }))
    expect(lastSchedule()).toMatchObject({ wed: [ref('back'), ref('warmup')], fri: [ref('back')] })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Убрать: Разминка' }))
    expect(lastSchedule()).toMatchObject({ wed: [ref('back')] })

    // The mocked profile does not change, so every edit starts from [warmup, back].
    await userEvent.click(within(dialog).getByRole('button', { name: '+ Добавить набор' }))
    const picker = screen.getByRole('dialog', { name: 'Добавить набор' })
    expect(within(picker).getByRole('button', { name: /Разминка/ })).toBeDisabled()
    await userEvent.click(within(picker).getByRole('button', { name: /Растяжка/ }))
    expect(lastSchedule()).toMatchObject({ wed: [ref('warmup'), ref('back'), ref('stretch')] })

    await userEvent.click(screen.getByRole('button', { name: 'Без тренировки' }))
    expect(lastSchedule()).toMatchObject({ wed: [] })
  })

  it('stops adding at five sets', async () => {
    seed(['warmup', 'back', 'back-home', 'stretch', 'warmup'].map(ref), [])
    renderToday()

    await userEvent.click(screen.getByRole('button', { current: 'date' }))

    expect(screen.getByRole('button', { name: '+ Добавить набор' })).toBeDisabled()
    expect(screen.getByText('В день можно назначить не больше 5 наборов')).toBeInTheDocument()
  })

  describe('place', () => {
    it('keeps the chosen place on the device, across visits and days', async () => {
      seed([ref('warmup'), ref('back')])
      renderToday()

      await userEvent.click(screen.getByRole('button', { name: 'Зал' }))
      cleanup()
      vi.setSystemTime(new Date(2026, 10, 12, 12))
      renderToday()

      expect(screen.getByRole('button', { name: 'Зал' })).toHaveAttribute('aria-pressed', 'true')
      expect(usePlaceStore.getState().place).toBe('gym')
      expect(mocks.update).not.toHaveBeenCalled()
    })

    it('shows the switch when nothing is paired, and says when the place has no sets', async () => {
      seed([ref('warmup')], [])
      renderToday()

      await userEvent.click(screen.getByRole('button', { name: 'Зал' }))

      expect(screen.getByText(/На сегодня нет наборов для зала/)).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'День отдыха' })).not.toBeInTheDocument()
    })

    it("lists only the place's sets in the day picker, a pair never twice", async () => {
      seed([ref('warmup'), ref('back')], [])
      renderToday()

      await userEvent.click(screen.getByRole('button', { current: 'date' }))
      await userEvent.click(screen.getByRole('button', { name: '+ Добавить набор' }))
      const picker = screen.getByRole('dialog', { name: 'Добавить набор' })

      expect(picker).toHaveTextContent('Наборы для дома')
      expect(within(picker).getByRole('button', { name: /Спина дома/ })).toBeDisabled()
      expect(
        within(picker).queryByRole('button', { name: /^Спина(?! дома)/ }),
      ).not.toBeInTheDocument()

      await userEvent.click(within(picker).getByRole('button', { name: /Растяжка/ }))
      expect(lastPatch()).toEqual({
        schedule: {
          ...defaultProfile.schedule,
          wed: [ref('warmup'), ref('back'), ref('stretch')],
          fri: [ref('back')],
        },
      })
    })

    it('offers the gym sets when the place is the gym', async () => {
      seed([ref('back')], [])
      renderToday()

      await userEvent.click(screen.getByRole('button', { name: 'Зал' }))
      await userEvent.click(screen.getByRole('button', { current: 'date' }))
      await userEvent.click(screen.getByRole('button', { name: '+ Добавить набор' }))
      const picker = screen.getByRole('dialog', { name: 'Добавить набор' })

      expect(within(picker).getByRole('button', { name: /^Спина/ })).toBeDisabled()
      expect(within(picker).queryByRole('button', { name: /Растяжка/ })).not.toBeInTheDocument()
    })
  })
})
