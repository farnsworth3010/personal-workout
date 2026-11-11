import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ValueStrip } from './value-strip'

const strip = (props: Partial<React.ComponentProps<typeof ValueStrip>> = {}) => {
  const onChange = vi.fn()
  const element = (value: number) => (
    <ValueStrip label="Вес, кг" value={value} onChange={onChange} max={70} step={2.5} {...props} />
  )

  const view = render(element(props.value ?? 60))

  return {
    onChange,
    rerender: (value: number) => view.rerender(element(value)),
    group: screen.getByRole('group', { name: 'Вес, кг' }),
  }
}

const chips = () => screen.getAllByRole('button').map((chip) => chip.textContent)

const chip = (name: string) => screen.getByRole('button', { name })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ValueStrip', () => {
  it('renders the grid with the value selected', () => {
    strip({ max: 10 })

    expect(chips()).toEqual(['0', '2,5', '5', '7,5', '10', '60'])
    expect(chip('60')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('5')).toHaveAttribute('aria-pressed', 'false')
  })

  it('selects a tapped value', async () => {
    const { onChange } = strip()

    await userEvent.click(chip('62,5'))

    expect(onChange).toHaveBeenCalledWith(62.5)
  })

  it('changes nothing on scroll alone', () => {
    const { onChange, group } = strip()

    fireEvent.scroll(group, { target: { scrollLeft: 300 } })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('centres the selected chip on mount and when the value changes', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return Number(this.textContent.replace(',', '.')) * 20
    })
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(60)
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(360)

    const scrollLeft = vi.spyOn(Element.prototype, 'scrollLeft', 'set')
    const { rerender } = strip()

    expect(scrollLeft).toHaveBeenLastCalledWith(60 * 20 - 150)

    rerender(65)

    expect(scrollLeft).toHaveBeenLastCalledWith(65 * 20 - 150)
  })

  it('turns the selected chip into a decimal input and saves an exact value with a comma', async () => {
    const { onChange, rerender } = strip()

    await userEvent.click(chip('60'))

    const input = screen.getByRole('textbox', { name: 'Вес, кг' })

    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveFocus()

    await userEvent.clear(input)
    await userEvent.type(input, '61,3{Enter}')

    expect(onChange).toHaveBeenCalledWith(61.3)

    rerender(61.3)

    expect(chips().slice(23, 27)).toEqual(['57,5', '60', '61,3', '62,5'])
    expect(chip('61,3')).toHaveAttribute('aria-pressed', 'true')
  })

  it('accepts a dot as the decimal separator', async () => {
    const { onChange } = strip()

    await userEvent.click(chip('60'))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), '42.25{Enter}')

    expect(onChange).toHaveBeenCalledWith(42.25)
  })

  it.each([['abc'], [''], ['-5'], ['70,5']])('rejects %j and restores the chip', async (text) => {
    const { onChange } = strip()

    await userEvent.click(chip('60'))
    await userEvent.clear(screen.getByRole('textbox'))
    if (text) await userEvent.type(screen.getByRole('textbox'), text)
    await userEvent.tab()

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(chip('60')).toHaveAttribute('aria-pressed', 'true')
  })

  it('rejects a fraction in an integer strip', async () => {
    const { onChange } = strip({ value: 8, step: 1, max: 200, integer: true })

    await userEvent.click(chip('8'))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), '8,5{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  describe('with nothing picked yet', () => {
    const unpicked = () => {
      const onChange = vi.fn()

      render(
        <ValueStrip label="Вес, кг" value={undefined} onChange={onChange} max={10} step={2.5} />,
      )

      return onChange
    }

    it('selects no chip and leads with a chip for an exact value', () => {
      unpicked()

      expect(chips()).toEqual(['своё', '0', '2,5', '5', '7,5', '10'])
      expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    })

    it('selects a tapped value', async () => {
      const onChange = unpicked()

      await userEvent.click(chip('5'))

      expect(onChange).toHaveBeenCalledWith(5)
    })

    it('takes an exact value from the leading chip', async () => {
      const onChange = unpicked()

      await userEvent.click(chip('Вес, кг: ввести своё'))

      const input = screen.getByRole('textbox', { name: 'Вес, кг' })

      expect(input).toHaveValue('')

      await userEvent.type(input, '7,25{Enter}')

      expect(onChange).toHaveBeenCalledWith(7.25)
    })

    it('stays unpicked when the input is left empty', async () => {
      const onChange = unpicked()

      await userEvent.click(chip('Вес, кг: ввести своё'))
      await userEvent.tab()

      expect(onChange).not.toHaveBeenCalled()
      expect(chip('Вес, кг: ввести своё')).toBeInTheDocument()
    })
  })

  it('scrolls sideways on a vertical wheel', () => {
    const { group } = strip()

    const notCancelled = fireEvent.wheel(group, { deltaY: 120 })

    expect(notCancelled).toBe(false)
    expect(group.scrollLeft).toBe(120)
  })
})
