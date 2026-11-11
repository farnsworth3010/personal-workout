import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChipRow } from './chip-row'

function renderRow() {
  render(<ChipRow aria-label="Мышцы" role="group" />)
  const row = screen.getByRole('group', { name: 'Мышцы' })

  // jsdom does not lay out, so scrollLeft is a plain stored value here.
  let left = 0
  Object.defineProperty(row, 'scrollLeft', {
    get: () => left,
    set: (value: number) => (left = value),
  })

  return row
}

describe('ChipRow', () => {
  it('turns a vertical wheel into a horizontal scroll', () => {
    const row = renderRow()

    const handled = fireEvent.wheel(row, { deltaY: 120 })

    expect(handled).toBe(false)
    expect(row.scrollLeft).toBe(120)
  })

  it('leaves a horizontal wheel or trackpad swipe to the browser', () => {
    const row = renderRow()

    const handled = fireEvent.wheel(row, { deltaX: 80, deltaY: 10 })

    expect(handled).toBe(true)
    expect(row.scrollLeft).toBe(0)
  })

  it('fades its edges with both mask properties', () => {
    const row = renderRow()

    expect(row.style.maskImage).toContain('linear-gradient')
    expect(row.style.getPropertyValue('-webkit-mask-image')).toContain('linear-gradient')
  })
})
