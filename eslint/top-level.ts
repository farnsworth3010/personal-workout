import type { AST } from 'eslint'

// ESTree types through eslint's own, since `estree` is not a direct dependency.
type Statement = AST.Program['body'][number]
type Declarator = Extract<Statement, { type: 'VariableDeclaration' }>['declarations'][number]
type Expression = NonNullable<Declarator['init']>
type TopNode =
  Statement | Declarator | Extract<Statement, { type: 'ExportDefaultDeclaration' }>['declaration']

// The declarations at module level, unwrapped from `export` and `export default`.
export function* topLevel(program: AST.Program): Generator<TopNode> {
  for (const statement of program.body) {
    const node =
      (statement.type === 'ExportNamedDeclaration' ||
        statement.type === 'ExportDefaultDeclaration') &&
      statement.declaration
        ? statement.declaration
        : statement

    if (node.type === 'VariableDeclaration') yield* node.declarations
    else yield node
  }
}

const isPascal = (name: string) => /^[A-Z][A-Za-z0-9]*$/.test(name)

const COMPONENT_WRAPPERS = new Set(['memo', 'forwardRef'])

function calleeName(node: Expression) {
  if (node.type !== 'CallExpression') return undefined

  const { callee } = node
  if (callee.type === 'Identifier') return callee.name
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier')
    return callee.property.name

  return undefined
}

/** The component's name when the node declares a PascalCase function or a memo/forwardRef. */
export function componentName(node: TopNode): string | undefined {
  if (node.type === 'FunctionDeclaration')
    return node.id && isPascal(node.id.name) ? node.id.name : undefined

  if (node.type !== 'VariableDeclarator' || node.id.type !== 'Identifier' || !node.init)
    return undefined

  const { name } = node.id
  const { init } = node
  const isFunction = init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression'

  return isPascal(name) && (isFunction || COMPONENT_WRAPPERS.has(calleeName(init) ?? ''))
    ? name
    : undefined
}

/** A module-level `cva(…)` variants object, which may stay next to its component. */
export const isCva = (node: Declarator) => node.init != null && calleeName(node.init) === 'cva'
