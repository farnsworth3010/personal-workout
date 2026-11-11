import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, it } from 'vitest'

import rule from './no-color-literals.ts'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const error = (color: string) => ({ messageId: 'colorLiteral', data: { color } })

ruleTester.run('no-color-literals', rule, {
  valid: [
    "document.getElementById('root')",
    "document.querySelector('#root')",
    "const a = '#add-button'",
    "const url = 'https://example.com/page#section'",
    "const url = '/workouts#add'",
    "const entity = '&#123;'",
    "const issue = '#12345'",
    "const path = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'",
    '<path d="M3 12h18M12 3v18" />',
    '<div className="bg-background text-foreground hover:bg-primary/80" />',
    "const c = 'hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]'",
    "const c = 'bg-[var(--color-primary)]'",
    'const t = `${base}#main`',
    'myrgb(1, 2, 3)',
  ],
  invalid: [
    { code: "const c = '#fff'", errors: [error('#fff')] },
    { code: "const c = '#FFFA'", errors: [error('#FFFA')] },
    { code: "const c = '#a1b2c3'", errors: [error('#a1b2c3')] },
    { code: "const c = '#a1b2c3d4'", errors: [error('#a1b2c3d4')] },
    { code: "const c = 'rgb(0 0 0)'", errors: [error('rgb(')] },
    { code: "const c = 'rgba(0, 0, 0, 0.5)'", errors: [error('rgba(')] },
    { code: "const c = 'hsl(10 20% 30%)'", errors: [error('hsl(')] },
    { code: "const c = 'hsla(10, 20%, 30%, 1)'", errors: [error('hsla(')] },
    { code: "const c = 'oklch(0.7 0.1 200)'", errors: [error('oklch(')] },
    { code: "const c = 'oklab(0.7 0.1 0.1)'", errors: [error('oklab(')] },
    { code: "const c = 'border bg-[#fff] p-2'", errors: [error('#fff')] },
    { code: "const c = 'text-[rgb(1,2,3)]'", errors: [error('rgb(')] },
    { code: "const c = 'shadow-[0_0_4px_#000]'", errors: [error('#000')] },
    { code: 'const c = `bg-[${x}] text-[#123456]`', errors: [error('#123456')] },
    { code: '<div className="bg-[#0f0]" />', errors: [error('#0f0')] },
    { code: '<svg><circle fill="#ff0000" /></svg>', errors: [error('#ff0000')] },
    { code: "<div style={{ color: 'oklch(0.5 0.2 30)' }} />", errors: [error('oklch(')] },
  ],
})
