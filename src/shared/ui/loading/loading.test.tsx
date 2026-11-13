import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Loading } from './loading'

describe('Loading', () => {
  it('exposes a status role with the loading label and sr-only text', () => {
    render(<Loading>content</Loading>)
    const status = screen.getByRole('status', { name: 'Загрузка' })
    expect(status).toHaveTextContent('Загрузка…')
  })
})
