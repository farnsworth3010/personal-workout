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

function renderSheet(onPick = vi.fn()) {
  const client = createQueryClient()
  client.setQueryData(catalogQuery.queryKey, catalog)
  render(
    <QueryClientProvider client={client}>
      <PickExerciseSheet
        open
        onOpenChange={() => undefined}
        onPick={onPick}
        homeEquipment={['dumbbell']}
        disabledIds={['Plank']}
      />
    </QueryClientProvider>,
  )

  return within(screen.getByRole('list', { name: 'Упражнения' }))
}

describe('PickExerciseSheet', () => {
  it('lists the catalog with gym marks and already added exercises', () => {
    const list = renderSheet()

    expect(list.getAllByRole('listitem')).toHaveLength(3)
    expect(list.getByText('Barbell Bench Press')).toContainElement(list.getByText('зал'))
    expect(list.getByRole('button', { name: 'Уже добавлено: Plank' })).toBeDisabled()
    expect(screen.getByRole('searchbox')).toHaveFocus()
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

  it('says when nothing matches', async () => {
    const list = renderSheet()

    await userEvent.type(screen.getByRole('searchbox'), 'xyz')

    expect(list.getByText('Ничего не найдено по запросу «xyz».')).toBeInTheDocument()
  })
})
