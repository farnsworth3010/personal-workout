import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session'
import { createQueryClient, type Workout, type WorkoutEntry } from '@/shared/api'

import { FinishPage } from './finish-page'

const api = vi.hoisted(() => ({
  useExerciseStats: vi.fn(),
  useLastBodyWeight: vi.fn(),
  finishWorkout: vi.fn(),
  discardWorkout: vi.fn(),
}))
vi.mock('@/entities/workout', async (load) => ({
  ...(await load<typeof import('@/entities/workout')>()),
  ...api,
}))

const at = Timestamp.fromMillis(0)
const set = (n: number, reps: number, weightKg: number) => ({ n, reps, weightKg, at })

const entry = (exerciseId: string, name: string, patch: Partial<WorkoutEntry>): WorkoutEntry => ({
  exerciseId,
  name,
  kind: 'strength',
  status: 'done',
  plan: { sets: 2, reps: 10, restSec: 60 },
  sets: [],
  ...patch,
})

const bench = entry('Bench', 'Жим лёжа', { sets: [set(1, 10, 60), set(2, 8, 62.5)] })
const curl = entry('Curl', 'Сгибания', { status: 'skipped' })

function finishing(entries: WorkoutEntry[]) {
  const workout: Workout = {
    status: 'done',
    startedAt: Timestamp.fromMillis(Date.UTC(2026, 10, 11, 9)),
    endedAt: Timestamp.fromMillis(Date.UTC(2026, 10, 11, 9, 58, 40)),
    template: { source: 'ready', id: 'full', name: 'Всё тело' },
    entries,
    survey: {},
    summary: null,
    updatedAt: at,
  }
  useSessionStore.setState({ workoutId: 'w1', workout, finishing: true })
}

const user = { uid: 'u1', displayName: null, email: null, photoURL: null }

function renderFinish() {
  const router = createMemoryRouter(
    [
      { path: '/session/finish', element: <FinishPage user={user} /> },
      { path: '/', element: <p>today</p> },
    ],
    { initialEntries: ['/session/finish'] },
  )
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return router
}

describe('FinishPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useSessionStore.getState().discard()
    api.useExerciseStats.mockReturnValue({ Bench: { records: { maxWeightKg: 60 } } })
    api.useLastBodyWeight.mockReturnValue({ kg: 82.4, date: new Date(2026, 10, 9) })
  })

  it('summarises the workout with its new records and skipped exercises', () => {
    finishing([bench, curl])
    renderFinish()

    expect(screen.getByText('58:40')).toBeInTheDocument()
    expect(screen.getByText('из 2', { exact: false }).closest('dd')).toHaveTextContent('1 из 2')
    expect(screen.getByText('1,1').closest('dd')).toHaveTextContent('1,1 т')

    const records = screen.getByRole('region', { name: 'Новые рекорды' })
    expect(records).toHaveTextContent('Жим лёжа')
    expect(records).toHaveTextContent('Макс. вес: 62,5 кг · было 60 кг')

    const list = within(screen.getByRole('region', { name: 'Упражнения' }))
    expect(list.getByText('2 подхода · 60–62,5 кг')).toBeInTheDocument()
    expect(list.getByText('не выполнено')).toBeInTheDocument()
    expect(list.getByText('пропущено')).toBeInTheDocument()
  })

  it('saves the survey without skipped items and goes home', async () => {
    finishing([bench])
    const router = renderFinish()

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Самочувствие' })).getByRole('button', {
        name: '4',
      }),
    )
    // Items go wellbeing, energy, weight.
    await userEvent.click(screen.getAllByRole('button', { name: 'Пропустить' })[1])
    await userEvent.click(screen.getByRole('button', { name: 'Плюс 0,5 кг' }))
    expect(screen.getByText('+0,5 кг к прошлому разу')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить тренировку' }))

    expect(api.finishWorkout).toHaveBeenCalledWith(
      'u1',
      'w1',
      expect.objectContaining({ survey: { wellbeing: 4, bodyWeightKg: 82.9 } }),
      expect.any(Object),
    )
    expect(useSessionStore.getState().workout).toBeNull()
    expect(router.state.location.pathname).toBe('/')
  })

  it('asks before keeping a workout without sets and can delete it', async () => {
    finishing([curl])
    renderFinish()

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить тренировку' }))
    await userEvent.click(screen.getByRole('button', { name: 'Удалить тренировку' }))

    expect(api.discardWorkout).toHaveBeenCalledWith('u1', 'w1')
    expect(api.finishWorkout).not.toHaveBeenCalled()
    expect(useSessionStore.getState().workout).toBeNull()
  })

  it('asks for the body weight when there is no previous one', async () => {
    api.useLastBodyWeight.mockReturnValue(null)
    finishing([bench])
    renderFinish()

    const input = screen.getByRole('textbox', { name: 'Вес тела' })
    await userEvent.type(input, '75,5')
    await userEvent.tab()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить тренировку' }))

    expect(api.finishWorkout).toHaveBeenCalledWith(
      'u1',
      'w1',
      expect.objectContaining({ survey: { bodyWeightKg: 75.5 } }),
      expect.any(Object),
    )
  })
})
