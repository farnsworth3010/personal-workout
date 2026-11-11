import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Exercise } from '@/entities/exercise'
import { useSessionStore } from '@/entities/session'

import { TemplatesPage } from './templates-page'

const mocks = vi.hoisted(() => ({
  catalog: [] as unknown[],
  useProfile: vi.fn(),
  useReadyTemplates: vi.fn(),
  useOwnTemplates: vi.fn(),
  copyTemplate: vi.fn(),
}))
// Both catalog hooks, so the test holds whichever one the page reads.
vi.mock('@/entities/exercise', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCatalog: () => ({ data: mocks.catalog }),
  useCatalogById: () => ({
    data: Object.fromEntries((mocks.catalog as Exercise[]).map((e) => [e.id, e])),
  }),
}))
vi.mock('@/entities/profile', () => ({ useProfile: mocks.useProfile }))
vi.mock('@/entities/template', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useReadyTemplates: mocks.useReadyTemplates,
  useOwnTemplates: mocks.useOwnTemplates,
  copyTemplate: mocks.copyTemplate,
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

const pushups = { exerciseId: 'Pushups', sets: 3, reps: 12, restSec: 60 }
const squat = { exerciseId: 'Barbell_Squat', sets: 3, reps: 8, restSec: 120 }
const ready = [
  { id: 'r-home', name: 'Дом: отжимания', place: 'home', entries: [pushups] },
  { id: 'r-gym', name: 'Зал: присед', place: 'gym', entries: [squat] },
]
const own = [{ id: 'o1', name: 'Мой набор', copiedFrom: 'r-home', entries: [pushups] }]
const user = { uid: 'u1', displayName: null, email: null, photoURL: null }

function Location() {
  const { pathname, search } = useLocation()

  return <output aria-label="url">{pathname + search}</output>
}

const renderPage = (path = '/templates') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/templates" element={<TemplatesPage user={user} />} />
        <Route path="/session" element={<p>Тренировка</p>} />
      </Routes>
      <Location />
    </MemoryRouter>,
  )

const url = () => screen.getByRole('status', { name: 'url' }).textContent
const region = (name: RegExp) => screen.getByRole('region', { name })

beforeEach(() => {
  mocks.catalog = [exercise('Pushups', 'body only'), exercise('Barbell_Squat', 'barbell')]
  mocks.useProfile.mockReturnValue({
    profile: {
      homeEquipment: [],
      schedule: {
        mon: [{ source: 'own', id: 'o1' }],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
      },
    },
  })
  mocks.useReadyTemplates.mockReturnValue({ data: ready, error: null })
  mocks.useOwnTemplates.mockReturnValue({ data: own, error: null })
  useSessionStore.setState(useSessionStore.getInitialState(), true)
})

describe('TemplatesPage', () => {
  it('lists own and ready-made sets and filters them by place in the URL', async () => {
    renderPage()

    expect(within(region(/Мои наборы/)).getByText('Мой набор')).toBeInTheDocument()
    const readySets = region(/Готовые наборы/)
    expect(within(readySets).getByText('Дом: отжимания')).toBeInTheDocument()
    expect(within(readySets).getByText('Зал: присед')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Дома' }))

    expect(url()).toBe('/templates?place=home')
    expect(within(readySets).queryByText('Зал: присед')).not.toBeInTheDocument()
    expect(within(readySets).getByText('Дом: отжимания')).toBeInTheDocument()
  })

  it('copies a ready-made set once', async () => {
    renderPage()

    expect(screen.getByRole('button', { name: '«Дом: отжимания» уже скопирован' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Скопировать «Зал: присед» к себе' }))

    expect(mocks.copyTemplate).toHaveBeenCalledWith('u1', {
      id: 'r-gym',
      name: 'Зал: присед',
      entries: [squat],
    })
  })

  it('starts a set and opens the session', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Начать «Мой набор»' }))

    expect(url()).toBe('/session')
    expect(useSessionStore.getState().workout?.template).toMatchObject({
      source: 'own',
      id: 'o1',
      name: 'Мой набор',
    })
  })
})
