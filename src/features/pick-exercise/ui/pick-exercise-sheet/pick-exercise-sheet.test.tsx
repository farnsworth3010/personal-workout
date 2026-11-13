import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { catalogQuery, type Exercise } from '@/entities/exercise'
import { createQueryClient } from '@/shared/api'

import { PickExerciseSheet } from './pick-exercise-sheet'

const exercise = (id: string, name: string, extra: Partial<Exercise>): Exercise => ({
  id,
  name,
  kind: 'strength',
  primaryMuscles: [],
  secondaryMuscles: [],
  equipment: null,
  instructions: [],
  images: [`${id}/0.jpg`],
  ...extra,
})

const catalog = [
  exercise('Bench', 'Barbell Bench Press', { primaryMuscles: ['chest'], equipment: 'barbell' }),
  exercise('Plank', 'Plank', { primaryMuscles: ['abdominals'], equipment: 'body only' }),
  exercise('Row', 'Dumbbell Row', { primaryMuscles: ['middle back'], equipment: 'dumbbell' }),
]

function renderSheet(
  onPick = vi.fn(),
  onDetails?: (id: string) => void,
  exercises: Exercise[] = catalog,
) {
  const client = createQueryClient()
  client.setQueryData(catalogQuery.queryKey, exercises)
  render(
    <QueryClientProvider client={client}>
      <PickExerciseSheet
        open
        onOpenChange={() => undefined}
        onPick={onPick}
        homeEquipment={['dumbbell']}
        counts={{ Plank: 2 }}
        onDetails={onDetails}
      />
    </QueryClientProvider>,
  )

  return within(screen.getByRole('list', { name: 'Упражнения' }))
}

describe('PickExerciseSheet', () => {
  it('lists the catalog with gym marks and how often each is in the set', () => {
    const list = renderSheet()

    expect(list.getAllByRole('listitem')).toHaveLength(3)
    expect(list.getByText('Barbell Bench Press')).toContainElement(list.getByText('зал'))
    expect(list.getByText('Plank')).toContainElement(list.getByText('в наборе ×2'))
    expect(list.getByRole('button', { name: 'Добавить «Plank»' })).toBeEnabled()
    expect(screen.getByRole('searchbox')).toHaveFocus()
    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
  })

  it('shows a loading status before the catalog arrives', () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <PickExerciseSheet
          open
          onOpenChange={() => undefined}
          onPick={vi.fn()}
          homeEquipment={[]}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })

  it('searches by name and Russian muscle label and picks', async () => {
    const onPick = vi.fn()
    const list = renderSheet(onPick)

    await userEvent.type(screen.getByRole('searchbox'), 'спин')
    expect(list.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Dumbbell Row'),
    ])

    await userEvent.click(list.getByRole('button', { name: 'Добавить «Dumbbell Row»' }))
    expect(onPick).toHaveBeenCalledWith('Row')
  })

  it('finds abbreviations with the best match first', async () => {
    const list = renderSheet()

    await userEvent.type(screen.getByRole('searchbox'), 'bbp')

    expect(list.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Barbell Bench Press'),
    ])
  })

  it('filters by muscle group, equipment and home equipment like the catalog', async () => {
    const list = renderSheet()
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Мышцы' })).getByRole('button', { name: 'Пресс' }),
    )
    expect(list.getAllByRole('listitem')).toHaveLength(1)
    expect(list.getByText('Plank')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Все мышцы' }))
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Оборудование' })).getByRole('button', {
        name: 'Гантели',
      }),
    )
    expect(list.getAllByRole('listitem')).toHaveLength(1)
    expect(list.getByText('Dumbbell Row')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Любое оборудование' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Только для дома' }))
    expect(list.queryByText('Barbell Bench Press')).not.toBeInTheDocument()
    expect(list.getAllByRole('listitem')).toHaveLength(2)
  })

  it('opens the description of an exercise without picking it', async () => {
    const onPick = vi.fn()
    const onDetails = vi.fn()
    const list = renderSheet(onPick, onDetails)

    await userEvent.click(list.getByRole('button', { name: 'Описание «Dumbbell Row»' }))

    expect(onDetails).toHaveBeenCalledWith('Row')
    expect(onPick).not.toHaveBeenCalled()
  })

  it('says when nothing matches', async () => {
    const list = renderSheet()

    await userEvent.type(screen.getByRole('searchbox'), 'xyz')

    expect(list.getByText('Ничего не найдено по запросу «xyz».')).toBeInTheDocument()
  })

  it('renders a long catalog in pages and starts over when a filter changes', async () => {
    const many = Array.from({ length: 70 }, (_, n) =>
      exercise(`Ex_${n}`, `Exercise ${n}`, { primaryMuscles: ['chest'], equipment: 'dumbbell' }),
    )
    const list = renderSheet(vi.fn(), undefined, many)
    // Label and text queries: role queries over every row are too slow for a full test run.
    const rows = () => list.getAllByLabelText(/^Добавить «/)
    const more = () => list.queryByText('Показать ещё')

    expect(rows()).toHaveLength(60)

    await userEvent.click(list.getByText('Показать ещё'))
    expect(rows()).toHaveLength(70)
    expect(more()).not.toBeInTheDocument()

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Оборудование' })).getByText('Гантели'),
    )
    expect(rows()).toHaveLength(60)
    expect(more()).toBeInTheDocument()
  })
})
