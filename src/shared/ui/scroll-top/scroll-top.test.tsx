import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScrollTop } from './scroll-top'

const scrollToY = (y: number) =>
  act(() => {
    window.scrollY = y
    window.dispatchEvent(new Event('scroll'))
  })

// jsdom ignores inert in role queries, so visibility is checked through the attribute.
const button = () => screen.getByRole('button', { name: 'Наверх', hidden: true })

let reduced = false
const scrollTo = vi.fn()

beforeEach(() => {
  reduced = false
  window.innerHeight = 800
  window.scrollY = 0
  vi.stubGlobal('matchMedia', () => ({ matches: reduced }))
  scrollTo.mockClear()
  vi.stubGlobal('scrollTo', scrollTo)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-motion-off')
})

describe('ScrollTop', () => {
  it('is reachable only after about one screen of scrolling', () => {
    render(<ScrollTop />)
    expect(button()).toHaveAttribute('inert')

    scrollToY(600)
    expect(button()).toHaveAttribute('inert')

    scrollToY(700)
    expect(button()).not.toHaveAttribute('inert')

    scrollToY(100)
    expect(button()).toHaveAttribute('inert')
  })

  it('scrolls smoothly to the top and leaves focus alone', async () => {
    render(
      <>
        <input aria-label="Поиск" />
        <ScrollTop />
      </>,
    )
    scrollToY(2000)

    await userEvent.click(button())

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(screen.getByRole('textbox', { name: 'Поиск' })).not.toHaveFocus()
  })

  it('jumps without animation when motion is reduced or switched off', async () => {
    reduced = true
    render(<ScrollTop />)
    scrollToY(2000)
    await userEvent.click(button())
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })

    reduced = false
    document.documentElement.setAttribute('data-motion-off', '')
    await userEvent.click(button())
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
  })
})
