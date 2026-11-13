import type { Rule } from 'eslint'

import { componentName, topLevel } from './top-level.ts'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'One React component per .tsx file (CLAUDE.md, segments by role)' },
    schema: [],
    messages: {
      extraComponent:
        "'{{ name }}' is a second component in this file (first: '{{ first }}'): give it its own folder.",
    },
  },
  create(context) {
    return {
      Program(program) {
        let first: string | undefined

        for (const node of topLevel(program)) {
          const name = componentName(node)

          if (name === undefined) continue

          if (first === undefined) first = name
          else context.report({ node, messageId: 'extraComponent', data: { name, first } })
        }
      },
    }
  },
}

export default rule
