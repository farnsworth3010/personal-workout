import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Chip } from './chip'

describe('Chip', () => {
  it('toggles aria-pressed on click', async () => {
    const user = userEvent.setup()
    render(<Chip>Грудь</Chip>)
    const chip = screen.getByRole('button', { name: 'Грудь' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })
})
