import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Switch } from './switch'

describe('Switch', () => {
  it('toggles aria-checked and reports the new value', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Звук" onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('switch', { name: 'Звук' })
    expect(control).toHaveAttribute('aria-checked', 'false')

    await user.click(control)
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    await user.keyboard(' ')
    expect(control).toHaveAttribute('aria-checked', 'false')
  })
})
