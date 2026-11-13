import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('is hidden from the accessibility tree', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden')
  })

  it('is a span, block by default, so it nests inside a <p>', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild?.nodeName).toBe('SPAN')
    expect(container.firstChild).toHaveClass('block')
  })

  it('merges className, letting later classes win', () => {
    const { container } = render(<Skeleton className="h-4 rounded-full" />)
    expect(container.firstChild).toHaveClass('h-4', 'rounded-full', 'bg-muted')
    expect(container.firstChild).not.toHaveClass('rounded-md')
  })

  it('lets a caller switch back to inline-block', () => {
    const { container } = render(<Skeleton className="inline-block" />)
    expect(container.firstChild).toHaveClass('inline-block')
    expect(container.firstChild).not.toHaveClass('block')
  })
})
