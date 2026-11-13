import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, it } from 'vitest'

import rule from './one-component.ts'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const error = (name: string, first: string) => ({
  messageId: 'extraComponent',
  data: { name, first },
})

ruleTester.run('one-component', rule, {
  valid: [
    'export function TodayPage() { return <div /> }',
    'interface Props { a: string }\nexport function A({ a }: Props) { return <p>{a}</p> }',
    'export const A = () => <div />\nconst helper = () => 1',
    'function useThing() { return 1 }\nexport function A() { return null }',
    'export default function A() { return null }',
  ],
  invalid: [
    {
      code: 'function Body() { return null }\nexport function TodaySets() { return <Body /> }',
      errors: [error('TodaySets', 'Body')],
    },
    {
      code: 'export function A() { return null }\nexport const B = () => null',
      errors: [error('B', 'A')],
    },
    {
      code: 'export function A() { return null }\nconst B = memo(function B() { return null })',
      errors: [error('B', 'A')],
    },
    {
      code: 'export const A = () => null\nconst B = React.forwardRef(() => null)\nfunction C() { return null }',
      errors: [error('B', 'A'), error('C', 'A')],
    },
  ],
})
