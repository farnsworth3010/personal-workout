import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SyncNotice } from './sync-notice'

describe('SyncNotice', () => {
  it('appears when a write is rejected and closes on demand', async () => {
    let report: () => void = vi.fn()
    render(
      <SyncNotice
        subscribe={(listener) => {
          report = listener
          return vi.fn()
        }}
      />,
    )
    expect(screen.queryByRole('alert')).toBeNull()

    act(() => report())
    expect(screen.getByRole('alert')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
