import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SessionSkeleton } from './session-skeleton'

describe('SessionSkeleton', () => {
  it('shows the loading status', () => {
    render(<SessionSkeleton />)
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })
})
