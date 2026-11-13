import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatsSkeleton } from './stats-skeleton'

describe('StatsSkeleton', () => {
  it('shows the loading status and its own header by default', () => {
    render(<StatsSkeleton />)
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Статистика' })).toBeInTheDocument()
  })

  it('skips its own header when the page already shows one', () => {
    render(<StatsSkeleton withHeader={false} />)
    expect(screen.queryByRole('heading', { name: 'Статистика' })).not.toBeInTheDocument()
  })
})
