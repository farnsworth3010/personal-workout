import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// The plugin's types import @steiger/toolkit, which is not installed, so they resolve to any.
const recommended = fsd.configs.recommended as Parameters<typeof defineConfig>[0]

export default defineConfig([
  ...recommended,
  {
    ignores: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/__mocks__/**',
      '**/__tests__/**',
      'src/shared/lib/test/**',
    ],
  },
])
