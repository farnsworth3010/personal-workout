import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Section } from './section'

describe('Section', () => {
  it('is a region named by its heading, with the sub line and content', () => {
    render(
      <Section id="h-test" title="Регулярность" sub="За 4 недели">
        <p>Содержимое</p>
      </Section>,
    )

    const region = screen.getByRole('region', { name: 'Регулярность' })
    expect(screen.getByRole('heading', { level: 2, name: 'Регулярность' })).toHaveAttribute(
      'id',
      'h-test',
    )
    expect(region).toHaveTextContent('За 4 недели')
    expect(region).toHaveTextContent('Содержимое')
  })
})
