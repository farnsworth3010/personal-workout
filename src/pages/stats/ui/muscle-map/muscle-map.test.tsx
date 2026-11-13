import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MuscleMap } from './muscle-map'

describe('MuscleMap', () => {
  it('labels muscles with the Russian name and set count and marks the level', () => {
    render(<MuscleMap load={{ chest: 8, biceps: 0.5 }} selected={null} onSelect={vi.fn()} />)

    const chest = screen.getByRole('button', { name: 'Грудь: 8 подходов' })
    expect(chest).toHaveAttribute('data-level', '1')
    expect(screen.getByRole('button', { name: 'Бицепс: 0,5 подхода' })).toHaveAttribute(
      'data-level',
      '1',
    )
    expect(screen.getByRole('button', { name: 'Трицепс: 0 подходов' })).toHaveAttribute(
      'data-level',
      '0',
    )
  })

  it('selects a muscle by click and by keyboard', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<MuscleMap load={{}} selected="lats" onSelect={onSelect} />)

    expect(screen.getByRole('button', { name: /^Широчайшие/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /^Грудь/ }))
    expect(onSelect).toHaveBeenLastCalledWith('chest')

    screen.getByRole('button', { name: /^Ягодицы/ }).focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('glutes')

    screen.getByRole('button', { name: /^Поясница/ }).focus()
    await user.keyboard(' ')
    expect(onSelect).toHaveBeenLastCalledWith('lower back')
    expect(onSelect).toHaveBeenCalledTimes(3)
  })
})
