import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, it } from 'vitest'

import rule from './no-module-code.ts'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const error = (name: string) => ({ messageId: 'moduleCode', data: { name } })

ruleTester.run('no-module-code', rule, {
  valid: [
    "import { cn } from '@/shared/lib'\nexport function A() { const x = 1; return <p>{x}</p> }",
    'interface Props { a: string }\ntype Kind = "a" | "b"\nexport function A({ a }: Props) { return a }',
    "const buttonVariants = cva('base', { variants: {} })\nexport function Button() { return null }",
    'export const A = memo(() => null)',
    'export { A } from "./a"',
    // No component: an entry point, a router or a config with JSX.
    'const root = document.getElementById("root")\ncreateRoot(root).render(<App />)',
    'export const destinations = [{ icon: <House /> }]',
  ],
  invalid: [
    { code: 'const PAGE = 60\nexport function A() { return null }', errors: [error('PAGE')] },
    {
      code: 'export const labels = { a: "A" }\nexport function A() { return null }',
      errors: [error('labels')],
    },
    {
      code: 'const lower = (t: string) => t.toLowerCase()\nexport const A = () => null',
      errors: [error('lower')],
    },
    {
      code: 'function format(n: number) { return String(n) }\nexport function A() { return null }',
      errors: [error('format')],
    },
    {
      code: 'const { a, b } = obj\nexport function A() { return null }',
      errors: [error('destructuring')],
    },
  ],
})
