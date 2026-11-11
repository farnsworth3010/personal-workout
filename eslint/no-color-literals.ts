import type { Rule } from 'eslint'

// Bounded hex skips '#root', '/page#add' and '&#123;'; '_' may precede it as Tailwind's space.
const HEX = /(?<![a-z0-9&/])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i

function findColor(text: string): string | undefined {
  return HEX.exec(text)?.[0] ?? COLOR_FUNCTION.exec(text)?.[0]
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow colour literals; use theme tokens (constitution VI)' },
    schema: [],
    messages: {
      colorLiteral: "Colour literal '{{ color }}': use a theme token instead.",
    },
  },
  create(context) {
    function check(node: Rule.Node, text: string) {
      const color = findColor(text)

      if (color) context.report({ node, messageId: 'colorLiteral', data: { color } })
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value)
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw)
      },
    }
  },
}

export default rule
