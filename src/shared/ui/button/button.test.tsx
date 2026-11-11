import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from './button'

describe('Button', () => {
  it('renders an accessible button with its label', () => {
    render(<Button>Начать</Button>)

    expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument()
  })
})
