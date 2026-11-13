import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUser } from '@/shared/api'

import { AuthProvider } from '../auth-provider'
import { GuestGate } from '../guest-gate'
import { AuthGate } from './auth-gate'

const api = vi.hoisted(() => ({
  completeRedirectSignIn: vi.fn<() => Promise<void>>(),
  onAuthError: vi.fn(() => vi.fn()),
  subscribeAuth: vi.fn<(listener: (user: AuthUser | null) => void) => () => void>(),
}))
vi.mock('@/shared/api', () => api)

const profile = vi.hoisted(() => ({ ensureProfile: vi.fn() }))
vi.mock('@/entities/profile', () => profile)

const alice: AuthUser = { uid: 'a', displayName: 'Alice', email: 'a@x.dev', photoURL: null }
const bob: AuthUser = { uid: 'b', displayName: 'Bob', email: 'b@x.dev', photoURL: null }

// The same branches as routes/index.ts with stand-in pages.
function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        ),
        children: [
          { Component: GuestGate, children: [{ path: 'login', element: <p>login page</p> }] },
          { Component: AuthGate, children: [{ index: true, element: <p>today page</p> }] },
          { path: '*', element: <p>not found page</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)

  return router
}

let finishRedirect: () => void

function signIn(user: AuthUser | null) {
  api.subscribeAuth.mockImplementation((listener) => {
    listener(user)
    return vi.fn()
  })
}

describe('auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.completeRedirectSignIn.mockReturnValue(
      new Promise<void>((resolve) => (finishRedirect = resolve)),
    )
    api.subscribeAuth.mockReturnValue(vi.fn())
  })

  it('shows the splash, not the login page, until Firebase answers', () => {
    renderAt('/')

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
    expect(document.querySelector('img[src="/icon.svg"]')).toBeInTheDocument()
  })

  it('stays loading while a redirect sign-in completes', () => {
    signIn(null)
    renderAt('/login')

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(api.completeRedirectSignIn).toHaveBeenCalledOnce()
  })

  it('sends a signed-out visitor to /login', async () => {
    signIn(null)
    const router = renderAt('/')
    act(() => finishRedirect())

    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(profile.ensureProfile).not.toHaveBeenCalled()
  })

  it('sends a signed-in visitor from /login to /', async () => {
    signIn(alice)
    const router = renderAt('/login')
    act(() => finishRedirect())

    expect(await screen.findByText('today page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(profile.ensureProfile).toHaveBeenCalledWith('a')
  })

  it('leaves the not-found page outside the gate', () => {
    renderAt('/no-such-page')

    expect(screen.getByText('not found page')).toBeInTheDocument()
  })

  it('renders the protected outlet at once when a last-user snapshot exists', () => {
    localStorage.setItem('pw:last-user', JSON.stringify(alice))

    renderAt('/')

    expect(screen.getByText('today page')).toBeInTheDocument()
  })

  it('sends a returning user to /login and drops the snapshot when Firebase reports signed out', async () => {
    localStorage.setItem('pw:last-user', JSON.stringify(alice))
    signIn(null)
    const router = renderAt('/')
    act(() => finishRedirect())

    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(localStorage.getItem('pw:last-user')).toBeNull()
  })

  it('swaps to the Firebase user when it differs from the snapshot', async () => {
    localStorage.setItem('pw:last-user', JSON.stringify(alice))
    signIn(bob)
    renderAt('/')
    act(() => finishRedirect())

    expect(await screen.findByText('today page')).toBeInTheDocument()
    expect(profile.ensureProfile).toHaveBeenCalledWith('b')
    expect(JSON.parse(localStorage.getItem('pw:last-user') ?? 'null')).toEqual(bob)
  })
})
