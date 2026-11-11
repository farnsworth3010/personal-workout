import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Sheet, SheetClose, SheetContent, SheetTrigger } from './sheet'

function renderSheet(dismissible?: boolean) {
  render(
    <Sheet>
      <SheetTrigger>Открыть</SheetTrigger>
      <SheetContent title="Описание" dismissible={dismissible}>
        <SheetClose>Готово</SheetClose>
      </SheetContent>
    </Sheet>,
  )

  return userEvent.setup()
}

describe('Sheet', () => {
  it('opens with its title and closes on Escape', async () => {
    const user = renderSheet()

    await user.click(screen.getByRole('button', { name: 'Открыть' }))
    expect(screen.getByRole('dialog', { name: 'Описание' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on a backdrop click and on the close button', async () => {
    const user = renderSheet()

    await user.click(screen.getByRole('button', { name: 'Открыть' }))
    const overlay = document.querySelector('[data-slot="sheet-overlay"]')
    if (!overlay) throw new Error('no overlay')
    await user.click(overlay)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Открыть' }))
    await user.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('focuses itself on open and traps focus inside', async () => {
    const user = renderSheet()

    await user.click(screen.getByRole('button', { name: 'Открыть' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveFocus()

    await user.tab()
    await user.tab()
    await user.tab()

    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })

  it('stays open on Escape and backdrop when not dismissible, and has no close button', async () => {
    const user = renderSheet(false)

    await user.click(screen.getByRole('button', { name: 'Открыть' }))
    await user.keyboard('{Escape}')
    const overlay = document.querySelector('[data-slot="sheet-overlay"]')
    if (!overlay) throw new Error('no overlay')
    await user.click(overlay)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Закрыть' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Готово' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
