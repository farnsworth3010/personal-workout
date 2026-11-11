import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Exercise } from '@/entities/exercise'

import { ExercisesPage } from './exercises-page'

const mocks = vi.hoisted(() => ({ useCatalog: vi.fn(), useProfile: vi.fn() }))

vi.mock('@/entities/exercise', async (original) => ({
  ...(await original<typeof import('@/entities/exercise')>()),
  useCatalog: mocks.useCatalog,
}))
vi.mock('@/entities/profile', () => ({ useProfile: mocks.useProfile }))
vi.mock('@/widgets/exercise-details', () => ({
  ExerciseDetails: ({
    exerciseId,
    open,
    children,
  }: {
    exerciseId: string
    open: boolean
    children: ReactNode
  }) =>
    open ? (
      <div role="dialog" aria-label={exerciseId}>
        {children}
      </div>
    ) : null,
  ExerciseDetailsPanel: ({ exerciseId, children }: { exerciseId: string; children: ReactNode }) => (
    <section aria-label={`panel ${exerciseId}`}>{children}</section>
  ),
}))

const exercise = (
  id: string,
  equipment: Exercise['equipment'],
  primaryMuscles: Exercise['primaryMuscles'],
): Exercise => ({
  id,
  name: id.replaceAll('_', ' '),
  kind: 'strength',
  primaryMuscles,
  secondaryMuscles: [],
  equipment,
  instructions: [],
  images: [`${id}/0.jpg`],
})

const catalog = [
  exercise('Barbell_Squat', 'barbell', ['quadriceps']),
  exercise('Dumbbell_Press', 'dumbbell', ['chest']),
  exercise('Pushups', 'body only', ['chest']),
  exercise('Leg_Press', 'machine', ['quadriceps']),
]

const names = catalog.map((e) => e.name)

const user = { uid: 'u1', displayName: null, email: 'a@example.com', photoURL: null }

function Location() {
  return <output aria-label="url">{useLocation().search}</output>
}

function renderPage(search = '', { desktop = false, exercises = catalog } = {}) {
  vi.stubGlobal('matchMedia', () => ({
    matches: desktop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  mocks.useCatalog.mockReturnValue({ data: exercises, isPending: false, isError: false })

  render(
    <MemoryRouter initialEntries={[`/exercises${search}`]}>
      <ExercisesPage user={user} />
      <Location />
    </MemoryRouter>,
  )
}

const rows = () => within(screen.getByRole('list')).getAllByRole('button')

// Each row's name and gym mark, found by text rather than by markup.
const listed = () =>
  rows().map((row) => {
    const name = names.find((n) => within(row).queryByText(n))

    return within(row).queryByText('зал') ? `${name ?? '?'} · зал` : (name ?? '?')
  })

const url = () => screen.getByRole('status', { name: 'url' }).textContent

beforeEach(() => {
  mocks.useProfile.mockReturnValue({ profile: { homeEquipment: ['dumbbell'] } })
})

describe('ExercisesPage', () => {
  it('lists the catalog with gym marks driven by the profile', () => {
    renderPage()

    expect(mocks.useProfile).toHaveBeenCalledWith('u1')
    expect(screen.getByText('Показаны все 4 упражнения')).toBeInTheDocument()
    expect(listed()).toEqual([
      'Barbell Squat · зал',
      'Dumbbell Press',
      'Pushups',
      'Leg Press · зал',
    ])
    expect(screen.getByText('Гантели и свой вес — из профиля')).toBeInTheDocument()
  })

  it('restores search and filters from the URL', () => {
    renderPage('?q=press&home')

    expect(screen.getByRole('searchbox', { name: 'Поиск по каталогу' })).toHaveValue('press')
    expect(screen.getByRole('switch', { name: /Только для дома/ })).toBeChecked()
    expect(listed()).toEqual(['Dumbbell Press'])
    expect(screen.getByText('Найдено: 1 упражнение')).toBeInTheDocument()
  })

  it('keeps chips, the switch and the search in the URL', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Ноги' }))
    expect(url()).toBe('?muscle=legs')
    expect(listed()).toEqual(['Barbell Squat · зал', 'Leg Press · зал'])

    await userEvent.click(screen.getByRole('button', { name: 'Тренажёр' }))
    await userEvent.click(screen.getByRole('switch', { name: /Только для дома/ }))
    await userEvent.type(screen.getByRole('searchbox'), 'leg')

    expect(url()).toBe('?q=leg&muscle=legs&equipment=machine&home=')
  })

  it('offers to reset an empty result', async () => {
    renderPage('?q=zzz&muscle=chest')

    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
    expect(screen.getByText(/по запросу «zzz», в группе «Грудь»/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Сбросить поиск и фильтры' }))

    expect(url()).toBe('')
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(rows()).toHaveLength(4)
  })

  it('opens the details sheet with a disabled add action on phones', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: /Pushups/ }))

    const sheet = screen.getByRole('dialog', { name: 'Pushups' })
    expect(within(sheet).getByRole('button', { name: 'Добавить в набор' })).toBeDisabled()
  })

  it('shows the first listed exercise in the desktop panel until one is picked', async () => {
    renderPage('?muscle=chest', { desktop: true })

    expect(screen.getByRole('region', { name: 'panel Dumbbell_Press' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Pushups/ }))

    expect(screen.getByRole('region', { name: 'panel Pushups' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pushups/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a long list in chunks', async () => {
    const many = Array.from({ length: 130 }, (_, n) => exercise(`Ex_${n}`, 'dumbbell', ['chest']))
    renderPage('', { exercises: many })

    expect(rows()).toHaveLength(60)

    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё' }))

    expect(rows()).toHaveLength(130)
    expect(screen.queryByRole('button', { name: 'Показать ещё' })).not.toBeInTheDocument()
  })
})
