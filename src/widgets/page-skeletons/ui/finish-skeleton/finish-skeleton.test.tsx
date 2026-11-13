import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FinishSkeleton } from './finish-skeleton'

describe('FinishSkeleton', () => {
  it('shows the loading status', () => {
    render(<FinishSkeleton />)
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })
})
