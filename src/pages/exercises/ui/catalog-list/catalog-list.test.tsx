import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Exercise } from '@/entities/exercise'

import { CatalogList } from './catalog-list'

const exercise = (n: number): Exercise => ({
  id: `Ex_${n}`,
  name: `Ex ${n}`,
  kind: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'dumbbell',
  instructions: [],
  images: [],
})

const visible = [exercise(0), exercise(1), exercise(2)]

const renderList = (count: number, onMore = vi.fn()) =>
  render(
    <CatalogList
      visible={visible}
      total={10}
      count={count}
      current={null}
      homeEquipment={[]}
      onOpen={vi.fn()}
      onMore={onMore}
    />,
  )

describe('CatalogList', () => {
  it('renders the first count rows and asks for more', () => {
    const onMore = vi.fn()
    renderList(2, onMore)

    expect(screen.getByRole('list').childElementCount).toBe(2)
    fireEvent.click(screen.getByText('Показать ещё'))
    expect(onMore).toHaveBeenCalledOnce()
  })

  it('has no «Показать ещё» once everything is shown', () => {
    renderList(3)

    expect(screen.getByRole('list').childElementCount).toBe(3)
    expect(screen.queryByText('Показать ещё')).not.toBeInTheDocument()
  })
})
