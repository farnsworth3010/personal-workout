import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ExercisePhoto } from './exercise-photo'

describe('ExercisePhoto', () => {
  it('replaces a photo that fails to load with a placeholder of the same size', () => {
    const { rerender } = render(<ExercisePhoto src="/a.jpg" alt="Присед" className="size-12" />)

    fireEvent.error(screen.getByRole('img', { name: 'Присед' }))

    const placeholder = screen.getByRole('img', { name: 'Присед' })
    expect(placeholder.tagName).toBe('DIV')
    expect(placeholder).toHaveClass('size-12')

    // A new source gets its own attempt.
    rerender(<ExercisePhoto src="/b.jpg" alt="Присед" className="size-12" />)
    expect(screen.getByRole('img', { name: 'Присед' }).tagName).toBe('IMG')
  })

  it('hides a decorative placeholder from assistive technology', () => {
    const { container } = render(<ExercisePhoto src={undefined} />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
