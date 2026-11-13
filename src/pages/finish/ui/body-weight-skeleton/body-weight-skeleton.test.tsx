import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BodyWeightSkeleton } from './body-weight-skeleton'

describe('BodyWeightSkeleton', () => {
  it('shows the loading status while the previous weight loads', () => {
    render(<BodyWeightSkeleton />)
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })
})
