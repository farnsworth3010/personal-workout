import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Exercise } from '@/entities/exercise'
import { useSessionStore } from '@/entities/session'
import type { ExerciseStats } from '@/shared/api'

import { SessionPage } from './session-page'

const mocks = vi.hoisted(() => ({
  saveActiveWorkout: vi.fn(),
  stats: {},
  sounds: true,
  timers: { exercise: true, rest: true, workout: true },
  playSignal: vi.fn(),
  unlockAudio: vi.fn(),
}))

vi.mock('@/shared/lib', async (original) => ({
  ...(await original<typeof import('@/shared/lib')>()),
  playSignal: mocks.playSignal,
  unlockAudio: mocks.unlockAudio,
}))

vi.mock('@/entities/workout', () => ({
  saveActiveWorkout: mocks.saveActiveWorkout,
  useExerciseStats: () => mocks.stats,
}))

vi.mock('@/entities/profile', () => ({
  useProfile: () => ({
    profile: {
      homeEquipment: [],
      defaultWeightStepKg: 2.5,
      defaultRestSec: 90,
      sounds: mocks.sounds,
      timers: mocks.timers,
    },
  }),
}))

const exercise = (id: string): Exercise => ({
  id,
  name: id,
  kind: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  instructions: [],
  images: [],
})

vi.mock('@/entities/exercise', async (original) => ({
  ...(await original<typeof import('@/entities/exercise')>()),
  useCatalog: () => ({ data: [exercise('Bench'), exercise('Row')] }),
}))

// The real strips draw ~325 chips (reps to 200, weight to 300 in 2.5 kg steps), and every role query
// and rest-screen render walks them; a shorter grid keeps the values these tests tap. ValueStrip has its own tests.
vi.mock('@/shared/ui', async (original) => {
  const ui = await original<typeof import('@/shared/ui')>()

  return {
    ...ui,
    ValueStrip: (props: React.ComponentProps<typeof ui.ValueStrip>) => (
      <ui.ValueStrip {...props} max={Math.min(props.max, 80)} />
    ),
  }
})

vi.mock('@/widgets/exercise-details', () => ({ ExerciseDetails: () => null }))

vi.mock('@/features/pick-exercise', () => ({ PickExerciseSheet: () => null }))

const history = (lastSets: ExerciseStats['lastSets']): ExerciseStats => ({
  weightStepKg: null,
  lastSets,
  lastWorkoutId: 'w0',
  lastAt: Timestamp.fromMillis(0),
  records: {},
})

const plan = { sets: 3, reps: 10, restSec: 90 }

const start = () =>
  useSessionStore.getState().start({ source: 'ready', id: 't', name: 'Зал: жим' }, [
    { exerciseId: 'Bench', name: 'Bench', kind: 'strength', plan },
    { exerciseId: 'Row', name: 'Row', kind: 'strength', plan },
  ])

const show = () =>
  render(
    <MemoryRouter>
      <SessionPage user={{ uid: 'u1', displayName: null, email: null, photoURL: null }} />
    </MemoryRouter>,
  )

const strip = (name: string) => within(screen.getByRole('group', { name }))

const press = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }))

const loggedSets = (i = 0) =>
  useSessionStore
    .getState()
    .workout?.entries[i]?.sets.map(({ n, reps, weightKg }) => ({ n, reps, weightKg }))

beforeEach(() => {
  useSessionStore.getState().discard()
  mocks.saveActiveWorkout.mockClear()
  mocks.playSignal.mockClear()
  mocks.sounds = true
  mocks.timers = { exercise: true, rest: true, workout: true }
  mocks.stats = {
    Bench: history([
      { reps: 8, weightKg: 60 },
      { reps: 6, weightKg: 62.5 },
    ]),
  }
  start()
})

describe('SessionPage', () => {
  it('saves the prediction of an untouched strip and writes the workout', async () => {
    show()

    expect(screen.getByText('8 × 60')).toBeInTheDocument()

    await press('Подход сделан')

    expect(screen.getByText('В прошлый раз: 8 × 60 кг')).toBeInTheDocument()
    expect(strip('Повторы').getByRole('button', { name: '8' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(strip('Вес, кг').getByRole('button', { name: '60' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await press('Следующий подход')

    expect(loggedSets()).toEqual([{ n: 1, reps: 8, weightKg: 60 }])
    expect(mocks.saveActiveWorkout).toHaveBeenLastCalledWith(
      'u1',
      useSessionStore.getState().workoutId,
      useSessionStore.getState().workout,
    )
  })

  it('shifts the predicted weight of later sets by a changed weight', async () => {
    show()

    await press('Подход сделан')
    await userEvent.click(strip('Вес, кг').getByRole('button', { name: '65' }))
    await press('Следующий подход')

    expect(loggedSets()).toEqual([{ n: 1, reps: 8, weightKg: 65 }])
    expect(screen.getByText('6 × 67,5')).toBeInTheDocument()
  })

  it('postpones an exercise and resumes it with its logged sets', async () => {
    show()

    await press('Подход сделан')
    await press('Следующий подход')
    await press('Пропустить →')

    expect(screen.getByRole('heading', { name: 'Row' })).toBeInTheDocument()

    await press(/Отложено/)

    expect(screen.getByText('сделано подходов: 1 из 3')).toBeInTheDocument()

    await press('Вернуться')

    expect(screen.getByRole('heading', { name: 'Bench' })).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(loggedSets()).toEqual([{ n: 1, reps: 8, weightKg: 60 }])
  })

  it('goes back to a logged set and corrects it', async () => {
    show()

    await press('Подход сделан')
    await press('Следующий подход')
    await press('← Назад')

    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    await press('Подход сделан')
    await userEvent.click(strip('Вес, кг').getByRole('button', { name: '70' }))
    await press('Следующий подход')

    expect(loggedSets()).toEqual([{ n: 1, reps: 8, weightKg: 70 }])
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('picks no weight for a first-time exercise and logs the set without one', async () => {
    mocks.stats = {}
    show()

    expect(screen.getByText('10')).toBeInTheDocument()

    await press('Подход сделан')

    expect(strip('Вес, кг').queryAllByRole('button', { pressed: true })).toHaveLength(0)
    expect(strip('Повторы').getByRole('button', { name: '10' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await press('Следующий подход')

    expect(loggedSets()).toEqual([{ n: 1, reps: 10, weightKg: undefined }])
    expect(useSessionStore.getState().workout?.entries[0]?.sets[0]).not.toHaveProperty('weightKg')
  })

  it('carries a weight picked on a first-time exercise into the next set', async () => {
    mocks.stats = {}
    show()

    await press('Подход сделан')
    await userEvent.click(strip('Вес, кг').getByRole('button', { name: '40' }))
    await press('Следующий подход')

    expect(loggedSets()).toEqual([{ n: 1, reps: 10, weightKg: 40 }])
    expect(screen.getByText('10 × 40')).toBeInTheDocument()
  })

  it('shows the real rest countdown after a reload in the middle of a rest', async () => {
    useSessionStore.getState().completeSet({ reps: 8, weightKg: 60 }, Date.now() - 40_000)

    const saved = localStorage.getItem('personal-workout:session')

    useSessionStore.getState().discard()
    localStorage.setItem('personal-workout:session', saved ?? '')
    await useSessionStore.persist.rehydrate()
    show()

    expect(screen.getByTestId('rest-countdown')).toHaveTextContent('0:50')
    expect(screen.getByText('Отдых после подхода 1')).toBeInTheDocument()
  })

  it('hides the clocks switched off in settings and keeps the rest screen', async () => {
    mocks.timers = { exercise: false, rest: false, workout: false }
    show()

    expect(screen.queryByText('Время')).not.toBeInTheDocument()
    expect(screen.queryByText(/^\d\d:\d\d$/)).not.toBeInTheDocument()

    await press('Подход сделан')

    expect(screen.getByText('Отдых после подхода 1')).toBeInTheDocument()
    expect(screen.queryByTestId('rest-countdown')).not.toBeInTheDocument()

    await press('Следующий подход')

    expect(loggedSets()).toEqual([{ n: 1, reps: 8, weightKg: 60 }])
  })

  it('shows the clocks by default', () => {
    show()

    expect(screen.getByText('Время')).toBeInTheDocument()
    expect(screen.getAllByText(/^\d\d:\d\d$/)).toHaveLength(2)
  })

  describe('signals', () => {
    const played = () => mocks.playSignal.mock.calls.map(([signal]) => signal as string)

    const setVisibility = (state: DocumentVisibilityState) => {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
    }

    afterEach(() => {
      Reflect.deleteProperty(document, 'visibilityState')
    })

    it('marks a done set and the end of the workout', async () => {
      show()

      await press('Подход сделан')
      await press('Следующий подход')
      await press('Завершить')

      expect(played()).toEqual(['set-done', 'workout-done'])
    })

    it('ends the workout after the last set with one sound', async () => {
      for (let i = 0; i < 5; i++) {
        useSessionStore.getState().completeSet({ reps: 8 })
        useSessionStore.getState().next()
      }
      show()

      await press('Подход сделан')
      await press('Следующий подход')

      expect(played()).toEqual(['set-done', 'workout-done'])
      expect(useSessionStore.getState().finished?.workout.status).toBe('done')
    })

    it('stays silent with sounds off', async () => {
      mocks.sounds = false
      useSessionStore.getState().completeSet({ reps: 8 }, Date.now() - 100_000)
      show()

      await press('Следующий подход')
      await press('Подход сделан')

      expect(mocks.playSignal).not.toHaveBeenCalled()
    })

    it('signals a rest that ended while away once, on return', () => {
      useSessionStore.getState().completeSet({ reps: 8 }, Date.now() - 100_000)
      setVisibility('hidden')
      show()

      expect(played()).toEqual([])

      setVisibility('visible')
      setVisibility('visible')

      expect(played()).toEqual(['rest-end'])
    })

    it('does not signal the end of a rest with the rest timer off', () => {
      mocks.timers = { exercise: true, rest: false, workout: true }
      useSessionStore.getState().completeSet({ reps: 8 }, Date.now() - 100_000)
      show()

      expect(played()).toEqual([])
    })

    it('unlocks audio on any tap', () => {
      show()
      fireEvent.pointerDown(document.body)

      expect(mocks.unlockAudio).toHaveBeenCalled()
    })
  })
})
