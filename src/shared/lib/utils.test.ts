import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('lets a later Tailwind class override a conflicting earlier one', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})
