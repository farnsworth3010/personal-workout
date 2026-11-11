import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthContext, loading, type AuthState } from './auth-context'
import { PwaUpdate } from './pwa-update'

const session = vi.hoisted(() => ({ active: false }))
vi.mock('@/entities/session', () => ({
  selectActive: () => session.active,
  useSessionStore: (select: () => boolean) => select(),
}))

const signedIn: AuthState = {
  status: 'signedIn',
  user: { uid: 'a', displayName: null, email: null, photoURL: null },
}

const waiting = { postMessage: vi.fn() }

// A page controlled by the current worker with an update installed and waiting.
function stubUpdate(storage?: object) {
  vi.stubGlobal('navigator', {
    storage,
    serviceWorker: {
      controller: {},
      register: () => Promise.resolve({ waiting, addEventListener: vi.fn() }),
      addEventListener: (type: string, listener: () => void) => {
        if (type === 'controllerchange') swap.listener = listener
      },
      removeEventListener: vi.fn(),
    },
  })
}

const swap = { listener: (): void => undefined }

function renderWith(auth: AuthState = loading) {
  return render(
    <AuthContext value={auth}>
      <PwaUpdate />
    </AuthContext>,
  )
}

describe('PwaUpdate', () => {
  beforeEach(() => vi.stubEnv('PROD', true))

  afterEach(() => {
    session.active = false
    waiting.postMessage.mockClear()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('offers a waiting update outside a session and activates it on demand', async () => {
    stubUpdate()
    renderWith()

    await userEvent.click(await screen.findByRole('button', { name: 'Обновить' }))

    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('reloads after a worker swap from any tab, but only once the running workout ends', async () => {
    const reload = vi.fn()
    stubUpdate()
    vi.stubGlobal('location', { reload })
    session.active = true
    const { rerender } = renderWith()

    act(() => swap.listener())
    expect(reload).not.toHaveBeenCalled()

    session.active = false
    rerender(
      <AuthContext value={loading}>
        <PwaUpdate />
      </AuthContext>,
    )

    await waitFor(() => expect(reload).toHaveBeenCalledOnce())
  })

  it('keeps quiet while a workout runs', async () => {
    session.active = true
    stubUpdate()
    renderWith()

    // Let the registration promise settle before checking that nothing was offered.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('button', { name: 'Обновить' })).toBeNull()
  })

  it('stays silent without service workers or the storage API (plain http)', () => {
    vi.stubGlobal('navigator', {})

    expect(() => renderWith(signedIn)).not.toThrow()
  })

  it('asks for persistent storage once signed in, unless it is already granted', async () => {
    const persist = vi.fn(() => Promise.resolve(true))
    stubUpdate({ persisted: () => Promise.resolve(false), persist })

    renderWith(signedIn)

    await vi.waitFor(() => {
      expect(persist).toHaveBeenCalledOnce()
    })
  })
})
