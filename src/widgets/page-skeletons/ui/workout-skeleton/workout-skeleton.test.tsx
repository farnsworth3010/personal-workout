import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { WorkoutSkeleton } from './workout-skeleton'

describe('WorkoutSkeleton', () => {
  it('shows the loading status with a working back link', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/workouts/w1']}>
        <WorkoutSkeleton />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '‹ Назад' }))
  })
})
