import { render, screen, within } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { seedHistory } from '../../model/history.fixture'
import { StatsPage } from './stats-page'

const mocks = vi.hoisted(() => ({ useFullHistory: vi.fn(), useProfile: vi.fn() }))
vi.mock('@/entities/workout', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useFullHistory: mocks.useFullHistory,
}))
vi.mock('@/entities/profile', () => ({ useProfile: mocks.useProfile }))

const user = { uid: 'u1', displayName: null, email: null, photoURL: null }
const renderPage = () =>
  render(
    <MemoryRouter>
      <StatsPage user={user} />
    </MemoryRouter>,
  )
// Newest first with ids, as useFullHistory returns them.
const history = () =>
  seedHistory(now)
    .reverse()
    .map((w, i) => ({ ...w, id: `w${i}` }))
const now = new Date(2026, 10, 11, 12)
const ref = (id: string) => [{ source: 'ready', id }]

beforeAll(() => {
  // recharts' ResponsiveContainer needs it; jsdom has none.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
  mocks.useProfile.mockReturnValue({
    profile: {
      schedule: { mon: ref('a'), tue: [], wed: ref('b'), thu: [], fri: ref('c'), sat: [], sun: [] },
    },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('StatsPage', () => {
  it('asks for the whole history', () => {
    mocks.useFullHistory.mockReturnValue(undefined)
    renderPage()

    expect(mocks.useFullHistory).toHaveBeenCalledWith('u1')
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })

  it('explains every section when there is no data', () => {
    mocks.useFullHistory.mockReturnValue([])
    renderPage()

    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
    expect(screen.getByText('9–11 ноября · 0 тренировок')).toBeInTheDocument()
    expect(screen.getByText(/тренировок ещё не было/)).toBeInTheDocument()
    expect(screen.getByText(/отметятся в календаре/)).toBeInTheDocument()
    expect(screen.getByText(/появятся график веса, объёма и повторов/)).toBeInTheDocument()
    expect(screen.getByText(/Вес тела появится/)).toBeInTheDocument()
    expect(screen.getByText(/Самочувствие и энергия появятся/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Грудь: 0 подходов' })).toBeInTheDocument()
    expect(screen.getByText('11', { selector: 'span' })).toHaveClass('text-foreground')
  })

  it('counts total time over the whole history and opens the calendar back to the first month', () => {
    const [today] = history()
    const old = {
      ...today,
      startedAt: Timestamp.fromDate(new Date(2025, 0, 15, 18)),
      summary: today.summary && { ...today.summary, durationSec: 7200 },
    }
    mocks.useFullHistory.mockReturnValue([today, old])
    renderPage()

    // 55 min today + 2 h in January 2025.
    expect(screen.getByText('Всего времени').nextSibling).toHaveTextContent('3 ч')
    expect(screen.getByRole('button', { name: 'Предыдущий месяц' })).toBeEnabled()
  })

  it('lists the workouts of a day with several and links each one', async () => {
    const [today] = history()
    const later = { ...today, id: 'later', template: { ...today.template, name: 'Растяжка' } }
    mocks.useFullHistory.mockReturnValue([later, today])
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: /^11 ноября: / }))

    expect(screen.getByRole('link', { name: /Растяжка/ })).toHaveAttribute(
      'href',
      '/workouts/later',
    )
    expect(screen.getByRole('link', { name: /Зал: всё тело/ })).toHaveAttribute(
      'href',
      '/workouts/w0',
    )
  })

  describe('with history', () => {
    beforeEach(() => {
      mocks.useFullHistory.mockReturnValue(history())
    })

    it("shows this week's muscle load, the picked muscle and untrained muscles", async () => {
      renderPage()

      expect(screen.getByText('9–11 ноября · 2 тренировки')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Грудь: 8 подходов' }))
      expect(screen.getByText('лёгкая нагрузка')).toBeInTheDocument()

      const untrained = screen.getByRole('list', { name: '' })
      expect(within(untrained).getByRole('button', { name: 'Шея' })).toBeInTheDocument()
      expect(within(untrained).getByRole('button', { name: 'Предплечья' })).toBeInTheDocument()

      await userEvent.click(within(untrained).getByRole('button', { name: 'Шея' }))
      expect(screen.getByText('не тренировали')).toBeInTheDocument()
    })

    it('shows the calendar with counts and moves between months', async () => {
      renderPage()

      // Newest first: 11, 9, 6 and then 4 November.
      expect(screen.getByRole('link', { name: '4 ноября: Зал: всё тело' })).toHaveAttribute(
        'href',
        '/workouts/w3',
      )
      // Today with a workout keeps the dark text on the accent fill.
      const today = screen.getByRole('link', { name: /^11 ноября:/ })
      expect(today).toHaveClass('bg-primary', 'text-on-accent')
      expect(today).not.toHaveClass('text-foreground')
      expect(screen.getByText('В ноябре').nextSibling).toHaveTextContent('5')
      expect(screen.getByText('На этой неделе').nextSibling).toHaveTextContent('2 из 3')
      expect(screen.getByRole('button', { name: 'Следующий месяц' })).toBeDisabled()

      await userEvent.click(screen.getByRole('button', { name: 'Предыдущий месяц' }))
      expect(screen.getByText('октябрь 2026')).toBeInTheDocument()
      expect(screen.getByText('В октябре')).toBeInTheDocument()
    })

    it('shows exercise records and falls back to reps for bodyweight exercises', async () => {
      renderPage()

      const select = screen.getByRole('combobox', { name: 'Упражнение' })
      // The most recent workout (today, gym) comes first.
      expect(select).toHaveValue('Barbell_Bench_Press_-_Medium_Grip')
      expect(screen.getByText('Макс. вес').nextSibling).toHaveTextContent('62,5 кг')
      expect(screen.getAllByText(/последнее:/)[0]).toHaveTextContent('последнее: 62,5 кг')

      await userEvent.selectOptions(select, 'Pullups')
      expect(screen.getByRole('button', { name: 'Вес' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Повторы' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByText('Макс. вес').nextSibling).toHaveTextContent('—')
    })

    it('charts body weight and wellbeing', () => {
      renderPage()

      expect(screen.getByRole('img', { name: 'График веса тела' })).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'График самочувствия и энергии' })).toBeInTheDocument()
    })
  })
})
