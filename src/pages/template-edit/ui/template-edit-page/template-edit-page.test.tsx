import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Exercise } from '@/entities/exercise'

import { TemplateEditPage } from './template-edit-page'

const mocks = vi.hoisted(() => ({
  useCatalogById: vi.fn(),
  useProfile: vi.fn(),
  useOwnTemplates: vi.fn(),
  updateTemplate: vi.fn(),
  createTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  toast: vi.fn(),
}))
vi.mock('@/entities/exercise', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCatalogById: mocks.useCatalogById,
}))
vi.mock('@/entities/profile', () => ({ useProfile: mocks.useProfile }))
vi.mock('@/entities/template', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useOwnTemplates: mocks.useOwnTemplates,
  updateTemplate: mocks.updateTemplate,
  createTemplate: mocks.createTemplate,
  deleteTemplate: mocks.deleteTemplate,
}))
vi.mock('@/entities/workout', () => ({ useExerciseStats: () => undefined }))
vi.mock('@/features/pick-exercise', () => ({ PickExerciseSheet: () => null }))
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  toast: mocks.toast,
}))

const exercise = (id: string, kind: Exercise['kind']): Exercise => ({
  id,
  name: id,
  kind,
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'body only',
  instructions: [],
  images: [],
})

const byId = { Pushups: exercise('Pushups', 'bodyweight'), Plank: exercise('Plank', 'timed') }
const template = {
  id: 't1',
  name: 'Утро',
  copiedFrom: null,
  entries: [
    { id: 'e1', exerciseId: 'Pushups', sets: 3, reps: 12, restSec: 60 },
    { id: 'e2', exerciseId: 'Gone_Run', sets: 1, durationSec: 600, restSec: 0 },
  ],
}
const user = { uid: 'u1', displayName: null, email: null, photoURL: null }

function Search() {
  return <output aria-label="search">{useLocation().search}</output>
}

const renderPage = (path: string) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/templates" element={<p>Список наборов</p>} />
          <Route path="/templates/new" element={<TemplateEditPage user={user} />} />
          <Route path="/templates/:id" element={<TemplateEditPage user={user} />} />
        </Routes>
        <Search />
      </MemoryRouter>
    </StrictMode>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useCatalogById.mockReturnValue({ data: byId })
  mocks.useProfile.mockReturnValue({ profile: { homeEquipment: [], defaultRestSec: 90 } })
  mocks.useOwnTemplates.mockReturnValue({ data: [template], error: null })
})

describe('TemplateEditPage', () => {
  it('shows a loading skeleton with the real back link while the catalog or profile is pending', () => {
    mocks.useCatalogById.mockReturnValue({ data: undefined })
    renderPage('/templates/t1')

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Наборы/ })).toBeInTheDocument()
  })

  it('saves the edited rows and keeps an exercise that left the catalog as it was', async () => {
    renderPage('/templates/t1')

    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
    expect(screen.getByText(/Упражнение недоступно/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Подходы: Gone_Run' })).not.toBeInTheDocument()

    const reps = screen.getByRole('textbox', { name: 'Повторы: Pushups' })
    await userEvent.clear(reps)
    await userEvent.type(reps, '15')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mocks.updateTemplate).toHaveBeenCalledWith('u1', template, {
      name: 'Утро',
      entries: [
        { id: 'e1', exerciseId: 'Pushups', sets: 3, reps: 15, restSec: 60 },
        { id: 'e2', exerciseId: 'Gone_Run', sets: 1, durationSec: 600, restSec: 0 },
      ],
    })
    expect(screen.getByText('Список наборов')).toBeInTheDocument()
  })

  it('reports a bad field and focuses it instead of saving', async () => {
    renderPage('/templates/t1')

    const sets = screen.getByRole('textbox', { name: 'Подходы: Pushups' })
    await userEvent.clear(sets)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      '«Pushups»: подходов — целое число от 1 до 20',
    )
    expect(sets).toHaveFocus()
    expect(sets).toHaveAttribute('aria-invalid', 'true')
    expect(mocks.updateTemplate).not.toHaveBeenCalled()
  })

  it('opens a new set with the exercise from ?add once and says so once', () => {
    renderPage('/templates/new?add=Plank')

    const list = screen.getByRole('list', { name: 'Упражнения набора' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByRole('textbox', { name: 'Секунды: Plank' })).toHaveValue('30')
    expect(mocks.toast).toHaveBeenCalledTimes(1)
    expect(mocks.toast).toHaveBeenCalledWith('Добавлено: Plank')
    expect(screen.getByRole('status', { name: 'search' })).toHaveTextContent('')
  })

  it('appends ?add to an existing set and stays quiet when the set is gone', () => {
    renderPage('/templates/t1?add=Plank')

    const list = screen.getByRole('list', { name: 'Упражнения набора' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(mocks.toast).toHaveBeenCalledTimes(1)

    cleanup()
    vi.clearAllMocks()
    mocks.useOwnTemplates.mockReturnValue({ data: [], error: null })
    renderPage('/templates/t1?add=Plank')

    expect(screen.getByText('Набор не найден')).toBeInTheDocument()
    expect(mocks.toast).not.toHaveBeenCalled()
  })

  it('moves and removes rows', async () => {
    renderPage('/templates/t1')

    await userEvent.click(screen.getByRole('button', { name: 'Ниже: Pushups' }))
    const names = () =>
      within(screen.getByRole('list', { name: 'Упражнения набора' }))
        .getAllByRole('listitem')
        .map((li) =>
          within(li)
            .getByRole('button', { name: /^Убрать/ })
            .getAttribute('aria-label'),
        )
    expect(names()).toEqual(['Убрать «Gone_Run»', 'Убрать «Pushups»'])

    await userEvent.click(screen.getByRole('button', { name: 'Убрать «Gone_Run»' }))
    expect(names()).toEqual(['Убрать «Pushups»'])
    expect(mocks.toast).toHaveBeenCalledWith('Убрано: Gone_Run')
  })

  it('deletes the set with a click', async () => {
    renderPage('/templates/t1')

    await userEvent.click(screen.getByRole('button', { name: 'Удалить набор' }))

    expect(mocks.deleteTemplate).toHaveBeenCalledWith('u1', 't1')
    expect(screen.getByText('Список наборов')).toBeInTheDocument()
  })

  it('says when the set is gone', () => {
    mocks.useOwnTemplates.mockReturnValue({ data: [], error: null })
    renderPage('/templates/t1')

    expect(screen.getByText('Набор не найден')).toBeInTheDocument()
  })
})
