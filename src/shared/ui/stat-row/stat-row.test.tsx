import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Stat, StatRow } from './stat-row'

describe('Stat', () => {
  it('shows the label, the value and its unit', () => {
    render(
      <StatRow>
        <Stat label="Подходы" value={6} unit="из 8" />
        <Stat label="Время" value="62:05" size="sm" />
      </StatRow>,
    )

    expect(screen.getByText('Подходы').nextElementSibling).toHaveTextContent('6 из 8')
    expect(screen.getByText('из 8')).toHaveClass('text-muted-foreground')
    expect(screen.getByText('62:05')).toHaveClass('text-[22px]')
  })
})
