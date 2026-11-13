import pluginQuery from '@tanstack/eslint-plugin-query'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

import noColorLiterals from './eslint/no-color-literals.ts'
import noModuleCode from './eslint/no-module-code.ts'
import oneComponent from './eslint/one-component.ts'

export default defineConfig(
  globalIgnores([
    'dist',
    'dist-e2e*',
    'public/catalog',
    '.catalog-cache',
    '.claude',
    '.specify',
    'coverage',
    'playwright-report',
    'test-results',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Keeps JSX handlers like onClick={() => setOpen(true)} legal.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      pluginQuery.configs['flat/recommended'],
    ],
    plugins: {
      local: {
        rules: {
          'no-color-literals': noColorLiterals,
          'no-module-code': noModuleCode,
          'one-component': oneComponent,
        },
      },
    },
    rules: { 'local/no-color-literals': 'error' },
  },
  {
    // Component files (CLAUDE.md, segments by role).
    files: ['src/**/*.tsx'],
    ignores: ['**/*.test.tsx', 'src/shared/ui/{sheet,chart,stat-row}/**'],
    rules: { 'local/one-component': 'error' },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['**/*.test.tsx', 'src/shared/ui/**'],
    rules: { 'local/no-module-code': 'error' },
  },
  {
    // shadcn components export their cva variants next to the component.
    files: ['src/shared/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier,
)
