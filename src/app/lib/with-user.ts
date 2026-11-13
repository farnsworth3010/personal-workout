import { createElement, type ComponentType } from 'react'

import type { AuthUser } from '@/shared/api'

import { useAuth } from '../model/auth-context'

// Pages cannot import from app, so the gate's signed-in user reaches them as a prop.
export const withUser =
  (load: () => Promise<ComponentType<{ user: AuthUser }>>) => async (): Promise<ComponentType> => {
    const Page = await load()

    return function PageWithUser() {
      const { user } = useAuth()

      return user && createElement(Page, { user })
    }
  }
