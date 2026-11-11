import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'

import type { AuthUser } from '@/shared/api'

import { AuthGate, GuestGate } from '../layout/auth-gate'
import { SessionGuard } from '../layout/session-guard'
import { useAuth } from '../layout/auth-context'
import { NavLayout } from '../layout/nav-layout'
import { RootLayout } from '../layout/root-layout'
import { ScreenLayout } from '../layout/screen-layout'
import { PendingBar, Splash } from './splash'

// Pages cannot import from app, so the gate's signed-in user reaches them as a prop.
const withUser =
  (load: () => Promise<ComponentType<{ user: AuthUser }>>) => async (): Promise<ComponentType> => {
    const Page = await load()

    return function PageWithUser() {
      const { user } = useAuth()

      return user && <Page user={user} />
    }
  }

// contracts/routes.md; each page module loads on first visit.
const navRoutes: RouteObject[] = [
  {
    index: true,
    lazy: { Component: withUser(() => import('@/pages/today').then((m) => m.TodayPage)) },
  },
  {
    path: 'templates',
    lazy: { Component: withUser(() => import('@/pages/templates').then((m) => m.TemplatesPage)) },
  },
  {
    path: 'templates/new',
    lazy: {
      Component: withUser(() => import('@/pages/template-edit').then((m) => m.TemplateEditPage)),
    },
  },
  {
    path: 'templates/:id',
    lazy: {
      Component: withUser(() => import('@/pages/template-edit').then((m) => m.TemplateEditPage)),
    },
  },
  {
    path: 'exercises',
    lazy: { Component: withUser(() => import('@/pages/exercises').then((m) => m.ExercisesPage)) },
  },
  {
    path: 'stats',
    lazy: { Component: withUser(() => import('@/pages/stats').then((m) => m.StatsPage)) },
  },
  {
    path: 'workouts/:id',
    lazy: { Component: withUser(() => import('@/pages/workout').then((m) => m.WorkoutPage)) },
  },
  {
    path: 'settings',
    lazy: { Component: withUser(() => import('@/pages/settings').then((m) => m.SettingsPage)) },
  },
]

const sessionRoutes: RouteObject[] = [
  {
    path: 'session',
    lazy: { Component: withUser(() => import('@/pages/session').then((m) => m.SessionPage)) },
  },
  {
    path: 'session/finish',
    lazy: { Component: withUser(() => import('@/pages/finish').then((m) => m.FinishPage)) },
  },
]

// The branch is dropped from production builds, so the demo never ships.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        Component: NavLayout,
        children: [
          {
            path: 'dev/ui',
            lazy: { Component: () => import('@/shared/ui').then((m) => m.UiDemo) },
          },
        ],
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    HydrateFallback: Splash,
    children: [
      {
        Component: PendingBar,
        children: [
          {
            Component: GuestGate,
            children: [
              {
                path: 'login',
                lazy: { Component: () => import('@/pages/login').then((m) => m.LoginPage) },
              },
            ],
          },
          {
            Component: ScreenLayout,
            children: [
              {
                path: '*',
                lazy: { Component: () => import('@/pages/not-found').then((m) => m.NotFoundPage) },
              },
            ],
          },
          {
            Component: AuthGate,
            children: [
              {
                Component: NavLayout,
                children: [{ Component: ScreenLayout, children: navRoutes }],
              },
              {
                Component: SessionGuard,
                children: [{ Component: ScreenLayout, children: sessionRoutes }],
              },
            ],
          },
          ...devRoutes,
        ],
      },
    ],
  },
])
