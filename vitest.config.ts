import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'eslint/**/*.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'ui',
            environment: 'jsdom',
            include: ['src/**/*.test.tsx'],
            setupFiles: ['src/shared/lib/test/setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'rules',
            environment: 'node',
            include: ['tests/rules/**/*.test.ts'],
          },
        },
      ],
    },
  }),
)
