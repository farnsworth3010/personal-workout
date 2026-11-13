import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import type { AuthUser } from '@/shared/api'

import { BootFallback } from './boot-fallback'

const alice: AuthUser = { uid: 'a', displayName: 'Alice', email: 'a@x.dev', photoURL: null }

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '*', Component: BootFallback }], {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
}

describe('boot fallback', () => {
  afterEach(() => localStorage.clear())

  it('shows the splash without a last-user snapshot', () => {
    renderAt('/')

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('shows the navigation and the route skeleton with a last-user snapshot', () => {
    localStorage.setItem('pw:last-user', JSON.stringify(alice))
    renderAt('/stats')

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })
})
