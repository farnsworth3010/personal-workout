import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SyncNotice } from './sync-notice'

describe('SyncNotice', () => {
  it('appears when a write is rejected and closes on demand', async () => {
    let report: (error: unknown, label?: string) => void = vi.fn()
    render(
      <SyncNotice
        subscribe={(listener) => {
          report = listener
          return vi.fn()
        }}
      />,
    )
    expect(screen.queryByRole('alert')).toBeNull()

    act(() => report(new Error('x')))
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить изменения')

    act(() => report(new Error('x'), 'finish'))
    expect(screen.getByRole('alert')).toHaveTextContent('Продолжите её на экране «Сегодня»')

    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
