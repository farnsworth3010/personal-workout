import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSessionStore, type NewEntry } from '@/entities/session'

import { useStartWorkout } from '../../model/use-start-workout'
import { RunningWorkoutSheet } from './running-workout-sheet'

const template = { source: 'ready' as const, id: 'full-body', name: 'Всё тело' }
const entries: NewEntry[] = [
  {
    exerciseId: 'Pushups',
    name: 'Pushups',
    kind: 'bodyweight',
    plan: { sets: 3, reps: 10, restSec: 90 },
  },
]

function Starter() {
  const { start, blocked, setBlocked } = useStartWorkout()

  return (
    <>
      <button type="button" onClick={() => start(template, entries)}>
        Начать
      </button>
      <RunningWorkoutSheet open={blocked} onOpenChange={setBlocked} />
    </>
  )
}

const renderStarter = () => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Starter /> },
      { path: '/session', element: <h1>session</h1> },
      { path: '/session/finish', element: <h1>finish</h1> },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)

  return router
}

describe('useStartWorkout', () => {
  beforeEach(() => useSessionStore.getState().discard())

  it('starts and opens the session when nothing runs', async () => {
    const router = renderStarter()

    await userEvent.click(screen.getByRole('button', { name: 'Начать' }))

    expect(router.state.location.pathname).toBe('/session')
    expect(useSessionStore.getState().workout?.template).toEqual(template)
  })

  it('offers to continue or finish a running workout instead of replacing it', async () => {
    useSessionStore.getState().start({ ...template, id: 'other', name: 'Спина' }, entries)
    const router = renderStarter()

    await userEvent.click(screen.getByRole('button', { name: 'Начать' }))

    expect(screen.getByRole('dialog', { name: 'Уже идёт тренировка' })).toHaveTextContent('«Спина»')
    expect(useSessionStore.getState().workout?.template.id).toBe('other')

    await userEvent.click(screen.getByRole('button', { name: 'Завершить и перейти к итогам' }))

    expect(router.state.location.pathname).toBe('/session/finish')
  })

  it('keeps a workout that waits on the finish screen and leads back to it', async () => {
    useSessionStore.getState().start({ ...template, id: 'other', name: 'Спина' }, entries)
    useSessionStore.getState().end()
    const router = renderStarter()

    await userEvent.click(screen.getByRole('button', { name: 'Начать' }))

    expect(screen.getByRole('dialog', { name: 'Тренировка не сохранена' })).toBeInTheDocument()
    expect(useSessionStore.getState().workout?.template.id).toBe('other')

    await userEvent.click(screen.getByRole('link', { name: 'К итогам тренировки' }))

    expect(router.state.location.pathname).toBe('/session/finish')
  })
})
