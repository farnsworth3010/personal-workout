import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CatalogFilters } from './catalog-filters'

const none = { group: null, equipment: null, homeOnly: false }

describe('CatalogFilters', () => {
  it('reports each choice as a patch and shows the current one', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <CatalogFilters
        value={{ ...none, group: 'back' }}
        onChange={onChange}
        allMuscles="Все мышцы"
        anyEquipment="Любое оборудование"
      />,
    )

    const muscles = screen.getByRole('group', { name: 'Мышцы' })
    expect(muscles).toContainElement(screen.getByRole('button', { name: 'Спина', pressed: true }))
    expect(screen.getByRole('button', { name: 'Все мышцы', pressed: false })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Грудь' }))
    expect(onChange).toHaveBeenLastCalledWith({ group: 'chest' })

    await user.click(screen.getByRole('button', { name: 'Все мышцы' }))
    expect(onChange).toHaveBeenLastCalledWith({ group: null })

    await user.click(screen.getByRole('button', { name: 'Гантели' }))
    expect(onChange).toHaveBeenLastCalledWith({ equipment: 'dumbbell' })

    await user.click(screen.getByRole('switch', { name: 'Только для дома' }))
    expect(onChange).toHaveBeenLastCalledWith({ homeOnly: true })
  })

  it('shows the row names and the home hint on request', () => {
    render(
      <CatalogFilters
        value={none}
        onChange={vi.fn()}
        allMuscles="Все"
        anyEquipment="Все"
        labelled
        homeHint="Гантели, свой вес — из профиля"
      />,
    )

    expect(screen.getByText('Оборудование')).not.toHaveClass('sr-only')
    expect(screen.getByRole('group', { name: 'Оборудование' })).toBeInTheDocument()
    expect(screen.getByText('Гантели, свой вес — из профиля')).toBeInTheDocument()
  })
})
