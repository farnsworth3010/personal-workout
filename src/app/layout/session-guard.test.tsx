import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSessionStore } from '@/entities/session'

import { SessionGuard } from './session-guard'

function pathAfter(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/', element: null },
      {
        Component: SessionGuard,
        children: [
          { path: '/session', element: null },
          { path: '/session/finish', element: null },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)

  return router.state.location.pathname
}

const start = () => useSessionStore.getState().start({ source: 'ready', id: 't', name: 'T' }, [])

describe('SessionGuard', () => {
  beforeEach(() => useSessionStore.getState().discard())

  it('sends both screens home without a workout', () => {
    expect(pathAfter('/session')).toBe('/')
    expect(pathAfter('/session/finish')).toBe('/')
  })

  it('keeps a running workout on /session', () => {
    start()

    expect(pathAfter('/session')).toBe('/session')
    expect(pathAfter('/session/finish')).toBe('/session')
  })

  it('keeps an ended workout on /session/finish', () => {
    start()
    useSessionStore.getState().end()

    expect(pathAfter('/session/finish')).toBe('/session/finish')
    expect(pathAfter('/session')).toBe('/session/finish')
  })
})
