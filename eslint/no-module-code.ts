import type { Rule } from 'eslint'

import { componentName, isCva, topLevel } from './top-level.ts'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'No module-level constants or helpers in a .tsx file: config/, lib/ or model/ hold them (CLAUDE.md)',
    },
    schema: [],
    messages: {
      moduleCode:
        "'{{ name }}' is module-level code in a component file: move it to config/, lib/ or model/.",
    },
  },
  create(context) {
    return {
      Program(program) {
        const nodes = [...topLevel(program)]

        // A .tsx without a component (entry point, router, config with JSX icons) is not a component file.
        if (!nodes.some((node) => componentName(node) !== undefined)) return

        for (const node of nodes) {
          if (componentName(node) !== undefined) continue

          if (node.type === 'FunctionDeclaration' && node.id)
            context.report({ node, messageId: 'moduleCode', data: { name: node.id.name } })

          if (node.type === 'VariableDeclarator' && !isCva(node)) {
            const name = node.id.type === 'Identifier' ? node.id.name : 'destructuring'

            context.report({ node, messageId: 'moduleCode', data: { name } })
          }
        }
      },
    }
  },
}

export default rule
