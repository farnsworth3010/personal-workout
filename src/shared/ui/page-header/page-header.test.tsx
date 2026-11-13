import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageHeader } from './page-header'
import { Skeleton } from '../skeleton'

describe('PageHeader', () => {
  it('shows the title and a text subtitle', () => {
    render(<PageHeader title="Статистика" subtitle="11 ноября" />)
    expect(screen.getByRole('heading', { name: 'Статистика' })).toBeInTheDocument()
    expect(screen.getByText('11 ноября')).toBeInTheDocument()
  })

  it('accepts a block-level subtitle, e.g. a Skeleton placeholder', () => {
    const { container } = render(<PageHeader title="Статистика" subtitle={<Skeleton />} />)
    expect(container.querySelector('p')).not.toBeInTheDocument()
  })
})
