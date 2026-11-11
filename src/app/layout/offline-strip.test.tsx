import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OfflineStrip } from './offline-strip'

function goOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

describe('OfflineStrip', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows while the device is offline and hides when it reconnects', () => {
    render(<OfflineStrip />)
    expect(screen.queryByRole('status')).toBeNull()

    act(() => goOnline(false))
    expect(screen.getByRole('status')).toHaveTextContent(/^Офлайн/)

    act(() => goOnline(true))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
