import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MuscleLegend } from './muscle-legend'

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
