import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AddToSetSheet } from './add-to-set-sheet'

const mocks = vi.hoisted(() => ({
  useCatalogById: vi.fn(),
  useTemplateList: vi.fn(),
}))

vi.mock('@/entities/exercise', async (original) => ({
  ...(await original<typeof import('@/entities/exercise')>()),
  useCatalogById: mocks.useCatalogById,
}))
vi.mock('@/entities/template', async (original) => ({
  ...(await original<typeof import('@/entities/template')>()),
  useTemplateList: mocks.useTemplateList,
}))

const ownSet = (id: string, name: string) => ({
  ref: { source: 'own' as const, id },
  name,
  entries: [{ id: 'e1', exerciseId: 'Pushups', sets: 3, reps: 12, restSec: 60 }],
  place: 'home' as const,
})

const renderSheet = () =>
  render(
    <MemoryRouter>
      <AddToSetSheet uid="u1" exerciseId="Pushups" homeEquipment={[]} open onOpenChange={vi.fn()} />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useCatalogById.mockReturnValue({ data: {} })
})

describe('AddToSetSheet', () => {
  it('shows a loading placeholder while the own sets are pending', () => {
    mocks.useTemplateList.mockReturnValue({ own: undefined })
    renderSheet()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Мои наборы' })).not.toBeInTheDocument()
  })

  it('lists the own sets once loaded', () => {
    mocks.useTemplateList.mockReturnValue({ own: [ownSet('t1', 'Утро'), ownSet('t2', 'Вечер')] })
    renderSheet()

    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
    const own = screen.getByRole('region', { name: 'Мои наборы' })
    expect(own).toHaveTextContent('Утро')
    expect(own).toHaveTextContent('Вечер')
  })
})
