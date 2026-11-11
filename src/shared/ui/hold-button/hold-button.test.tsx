import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HoldButton } from './hold-button'

const setup = () => {
  const onConfirm = vi.fn()

  render(<HoldButton label="Пропустить" onConfirm={onConfirm} />)

  return { onConfirm, button: screen.getByRole('button', { name: 'Пропустить' }) }
}

const touchDown = (button: HTMLElement) => fireEvent.pointerDown(button, { pointerType: 'touch' })

const wait = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('HoldButton', () => {
  it('fires at once on a mouse click', () => {
    const { onConfirm, button } = setup()

    fireEvent.pointerDown(button, { pointerType: 'mouse' })
    fireEvent.pointerUp(button, { pointerType: 'mouse' })
    fireEvent.click(button, { detail: 1 })

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('fires at once on a keyboard click, even after a touch', () => {
    const { onConfirm, button } = setup()

    touchDown(button)
    fireEvent.pointerCancel(button)
    fireEvent.click(button, { detail: 0 })

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('fires after a one-second touch hold with a growing fill, and ignores the click after it', () => {
    const { onConfirm, button } = setup()

    touchDown(button)

    expect(button).toHaveAttribute('data-holding')

    wait(999)

    expect(onConfirm).not.toHaveBeenCalled()

    wait(1)

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(button).not.toHaveAttribute('data-holding')

    fireEvent.pointerUp(button, { pointerType: 'touch' })
    fireEvent.click(button, { detail: 1 })

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('shows a hint to hold on an early touch release and fires nothing', () => {
    const { onConfirm, button } = setup()

    touchDown(button)
    wait(300)
    fireEvent.pointerUp(button, { pointerType: 'touch' })
    fireEvent.click(button, { detail: 1 })
    wait(1000)

    expect(onConfirm).not.toHaveBeenCalled()
    expect(button).toHaveTextContent('Удерживайте')

    wait(200)

    expect(button).toHaveTextContent('Пропустить')
  })

  it('cancels the hold when the pointer is cancelled', () => {
    const { onConfirm, button } = setup()

    touchDown(button)
    fireEvent.pointerCancel(button)
    wait(2000)

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('blocks the long-press context menu on touch only', () => {
    const { button } = setup()

    fireEvent.pointerDown(button, { pointerType: 'mouse' })

    expect(fireEvent.contextMenu(button)).toBe(true)

    touchDown(button)

    expect(fireEvent.contextMenu(button)).toBe(false)
  })

  it('ignores a touch click on a button mounted under the finger', () => {
    const { onConfirm, button } = setup()

    button.dispatchEvent(
      new PointerEvent('click', { bubbles: true, pointerType: 'touch', detail: 1 }),
    )

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('honours a custom hold duration', () => {
    const onConfirm = vi.fn()

    render(<HoldButton label="Назад" holdMs={500} onConfirm={onConfirm} />)
    touchDown(screen.getByRole('button'))
    wait(500)

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  describe('holdAlways', () => {
    const setupAlways = () => {
      const onConfirm = vi.fn()

      render(
        <HoldButton label="Сбросить прогресс" holdMs={10_000} holdAlways onConfirm={onConfirm} />,
      )

      return { onConfirm, button: screen.getByRole('button') }
    }

    it('ignores a plain mouse or keyboard click', () => {
      const { onConfirm, button } = setupAlways()

      fireEvent.click(button, { detail: 1 })
      fireEvent.click(button, { detail: 0 })

      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('fires after a ten-second mouse hold and counts the seconds down', () => {
      const { onConfirm, button } = setupAlways()

      fireEvent.pointerDown(button, { pointerType: 'mouse' })
      expect(button).toHaveTextContent('Держите… 10 с')
      wait(3000)
      expect(button).toHaveTextContent('Держите… 7 с')
      wait(6999)
      expect(onConfirm).not.toHaveBeenCalled()
      wait(1)

      expect(onConfirm).toHaveBeenCalledOnce()
      expect(button).toHaveTextContent('Сбросить прогресс')
    })

    it('fires after Space or Enter is held, and stops on an early release', () => {
      const { onConfirm, button } = setupAlways()

      fireEvent.keyDown(button, { key: 'Enter' })
      wait(4000)
      fireEvent.keyUp(button, { key: 'Enter' })
      wait(10_000)
      expect(onConfirm).not.toHaveBeenCalled()

      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.keyDown(button, { key: ' ', repeat: true })
      wait(10_000)

      expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('cancels the hold when the mouse is released early or focus leaves', () => {
      const { onConfirm, button } = setupAlways()

      fireEvent.pointerDown(button, { pointerType: 'mouse' })
      wait(5000)
      fireEvent.pointerUp(button, { pointerType: 'mouse' })
      expect(button).toHaveTextContent('Удерживайте')

      fireEvent.pointerDown(button, { pointerType: 'mouse' })
      fireEvent.blur(button)
      wait(10_000)

      expect(onConfirm).not.toHaveBeenCalled()
    })
  })
})
