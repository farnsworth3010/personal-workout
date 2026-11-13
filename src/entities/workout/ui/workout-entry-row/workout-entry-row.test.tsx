import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WorkoutEntryRow } from './workout-entry-row'

const renderRow = (props: Partial<Parameters<typeof WorkoutEntryRow>[0]>) =>
  render(
    <ul>
      <WorkoutEntryRow name="Bench Press" photoSrc={undefined} skipped={false} {...props} />
    </ul>,
  )

describe('WorkoutEntryRow', () => {
  it('shows the name, its line and the volume of a done entry', () => {
    renderRow({ detail: '4 × 12 · 60 кг', volume: '2,9 т', photoSrc: '/catalog/images/a/0.jpg' })

    expect(screen.getByRole('listitem')).toHaveTextContent('Bench Press4 × 12 · 60 кг2,9 т')
    expect(screen.getByRole('presentation')).toHaveAttribute('src', '/catalog/images/a/0.jpg')
  })

  it('strikes a skipped entry through and badges it instead of the volume', () => {
    renderRow({ skipped: true, volume: '2,9 т' })

    expect(screen.getByText('Bench Press')).toHaveClass('line-through')
    expect(screen.getByText('пропущено')).toBeInTheDocument()
    expect(screen.queryByText('2,9 т')).not.toBeInTheDocument()
  })

  it('shows the progress of an unfinished entry and what the parent puts below', () => {
    renderRow({ progress: '3 из 4', volume: '1 т', children: <ol aria-label="Подходы" /> })

    expect(screen.getByText('3 из 4')).toHaveClass('text-warn')
    expect(screen.queryByText('1 т')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Подходы' })).toBeInTheDocument()
  })
})
