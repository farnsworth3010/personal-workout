import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toast, Toaster } from './toast'

describe('toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows the latest message and hides it after two seconds', () => {
    render(<Toaster />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('data-state', 'closed')

    act(() => {
      toast('Сохранено')
    })
    expect(status).toHaveTextContent('Сохранено')
    expect(status).toHaveAttribute('data-state', 'open')

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    act(() => {
      toast('Удалено')
    })
    expect(status).toHaveTextContent('Удалено')

    // A replacing message gets its own full two seconds.
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(status).toHaveAttribute('data-state', 'open')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(status).toHaveAttribute('data-state', 'closed')
  })
})
