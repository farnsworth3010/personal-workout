import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from './login-page'

const api = vi.hoisted(() => ({ signInWithGoogle: vi.fn() }))
vi.mock('@/shared/api', () => api)

describe('LoginPage', () => {
  it('starts the Google sign-in from its only button', async () => {
    render(<LoginPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Войти через Google' }))

    expect(api.signInWithGoogle).toHaveBeenCalledOnce()
  })
})
