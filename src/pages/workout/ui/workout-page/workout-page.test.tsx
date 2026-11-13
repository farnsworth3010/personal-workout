import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { finishedWorkout } from '../../model/workout.fixture'
import { WorkoutPage } from './workout-page'

const mocks = vi.hoisted(() => ({
  useWorkout: vi.fn(),
  useFullHistory: vi.fn(),
  useCatalogById: vi.fn(),
}))
vi.mock('@/entities/workout', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWorkout: mocks.useWorkout,
  useFullHistory: mocks.useFullHistory,
}))
vi.mock('@/entities/exercise', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCatalogById: mocks.useCatalogById,
}))

const user = { uid: 'u1', displayName: null, email: null, photoURL: null }

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/workouts/w1']}>
      <Routes>
        <Route path="/workouts/:id" element={<WorkoutPage user={user} />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  mocks.useFullHistory.mockReturnValue([])
  mocks.useCatalogById.mockReturnValue({
    data: {
      'Barbell_Bench_Press_-_Medium_Grip': {
        id: 'Barbell_Bench_Press_-_Medium_Grip',
        name: 'Barbell Bench Press',
        kind: 'strength',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps', 'shoulders'],
        equipment: 'barbell',
        instructions: [],
        images: ['Barbell_Bench_Press_-_Medium_Grip/0.jpg'],
      },
    },
  })
})

describe('WorkoutPage', () => {
  it('shows a skeleton while the workout loads', () => {
    mocks.useWorkout.mockReturnValue(undefined)
    renderPage()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })

  it('shows the summary, every exercise with its sets and the survey', () => {
    mocks.useWorkout.mockReturnValue(finishedWorkout())
    renderPage()

    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
    expect(mocks.useWorkout).toHaveBeenCalledWith('u1', 'w1')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Зал: всё тело')
    expect(screen.getByText('Среда, 11 ноября · 18:02–19:00')).toBeInTheDocument()
    expect(screen.getByText('Время').nextSibling).toHaveTextContent('58:40')
    expect(screen.getByText('Подходы').nextSibling).toHaveTextContent('10 из 15')
    expect(screen.getByText('Объём').nextSibling).toHaveTextContent('3,3 т')

    const bench = screen.getByRole('list', { name: 'Подходы: Barbell Bench Press - Medium Grip' })
    expect(
      within(bench)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['110 × 60 кглучший', '210 × 60 кг', '38 × 62,5 кг', '46 × 62,5 кг'])
    expect(screen.getByText('грудь · трицепс, плечи')).toBeInTheDocument()
    expect(screen.getByText('2 из 4')).toBeInTheDocument()
    expect(screen.getByText('пропущено')).toBeInTheDocument()
    expect(screen.getByText('45 с')).toBeInTheDocument()

    expect(screen.getByRole('img', { name: 'Самочувствие: 4 из 5' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Энергия: 3 из 5' })).toBeInTheDocument()
    expect(screen.getByText('хорошо')).toBeInTheDocument()
    expect(screen.getByText(/82,1/)).toBeInTheDocument()
  })

  it('says "не указано" for a skipped survey', () => {
    mocks.useWorkout.mockReturnValue({ ...finishedWorkout(), survey: {} })
    renderPage()

    expect(screen.getAllByText('не указано')).toHaveLength(3)
  })

  it('reports a missing or unfinished workout', () => {
    mocks.useWorkout.mockReturnValue(null)
    const { unmount } = renderPage()
    expect(screen.getByText('Тренировка не найдена')).toBeInTheDocument()
    unmount()

    mocks.useWorkout.mockReturnValue({ ...finishedWorkout(), status: 'active' })
    renderPage()
    expect(screen.getByText('Тренировка не найдена')).toBeInTheDocument()
  })
})
