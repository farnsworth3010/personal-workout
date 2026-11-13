import { createBrowserRouter, type RouteObject } from 'react-router'

import { AuthGate } from '../layout/auth-gate'
import { GuestGate } from '../layout/guest-gate'
import { NavLayout } from '../layout/nav-layout'
import { RootLayout } from '../layout/root-layout'
import { ScreenLayout } from '../layout/screen-layout'
import { SessionGuard } from '../layout/session-guard'
import { withUser } from '../lib/with-user'
import { BootFallback } from './boot-fallback'

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
            lazy: { Component: () => import('@/pages/dev-ui').then((m) => m.UiDemo) },
          },
        ],
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    HydrateFallback: BootFallback,
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
])
