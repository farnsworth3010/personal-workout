import { describe, expect, it } from 'vitest'

import { TemplateEditSkeleton } from '@/widgets/page-skeletons'

import { skeletonFor } from './skeletons'

// Every path that navRoutes/sessionRoutes (routes/index.ts) can resolve to.
const paths = [
  '/',
  '/templates',
  '/templates/new',
  '/templates/abc',
  '/exercises',
  '/stats',
  '/workouts/abc',
  '/settings',
  '/session',
  '/session/finish',
]

describe('skeletonFor', () => {
  it.each(paths)('has a skeleton for %s', (path) => {
    expect(skeletonFor(path)).not.toBeNull()
  })

  it('resolves both /templates/new and a dynamic id to TemplateEditSkeleton', () => {
    expect(skeletonFor('/templates/new')).toBe(TemplateEditSkeleton)
    expect(skeletonFor('/templates/abc')).toBe(TemplateEditSkeleton)
  })

  it('returns null for an unknown path', () => {
    expect(skeletonFor('/no-such-route')).toBeNull()
  })
})
