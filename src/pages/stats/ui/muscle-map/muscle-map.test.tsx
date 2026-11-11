import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { muscleSchema } from '@/shared/api'

import { loadLevel } from '../../model/muscle-load'
import { MuscleLegend, MuscleMap } from './muscle-map'
import { figure, midlineSpan, offFigureMuscles } from './shapes'

describe('figure shapes', () => {
  it('draws every catalog muscle or lists it as off the figure, eyes aside', () => {
    const drawn = new Set([...Object.keys(figure.front), ...Object.keys(figure.back)])
    const body = muscleSchema.options.filter((m) => m !== 'eyes')

    expect(offFigureMuscles.filter((m) => drawn.has(m))).toEqual([])
    expect([...drawn, ...offFigureMuscles].sort()).toEqual([...body].sort())
  })
})

describe('midlineSpan', () => {
  const bridged = (view: 'front' | 'back') =>
    Object.entries(figure[view]).flatMap(([m, paths]) => (midlineSpan(paths) ? [m] : []))

  it('bridges the muscles whose halves meet at the midline, and not the legs', () => {
    expect(bridged('front')).toEqual(['chest', 'abdominals'])
    expect(bridged('back')).toEqual(['traps', 'lower back', 'glutes'])
    expect(midlineSpan(figure.front.chest ?? [])).toEqual([78, 121])
  })
})

describe('loadLevel', () => {
  it.each([
    [0, 0],
    [0.5, 1],
    [9.5, 1],
    [10, 2],
    [20, 2],
    [20.5, 3],
    [30, 3],
  ])('%s sets → level %s', (sets, level) => {
    expect(loadLevel(sets)).toBe(level)
  })
})

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

describe('MuscleLegend', () => {
  it('shows the four levels', () => {
    render(<MuscleLegend />)

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'нет',
      '1–9',
      '10–20',
      '20+ подходов',
    ])
  })
})
