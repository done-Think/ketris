import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export function findConventionViolations(file, source) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  const violations = []
  const test = /(?:\/tests?\/|\/__tests__\/|\.(?:test|spec)\.)/.test(file)
  if (test || file.includes('/generated/')) return violations
  const schema = file.includes('/server/') && file.includes('/schemas/')
  const report = (node, message) =>
    violations.push(
      `${file}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1}: ${message}`,
    )
  function visit(node) {
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword)
      report(node, 'Use the concrete type instead of an unknown assertion.')
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(ast).replace(/['"]/g, '') === 'currency' &&
      ts.isStringLiteral(node.initializer) &&
      node.initializer.text === 'BRL' &&
      !file.endsWith('/shared/config/currency.ts')
    )
      report(node, 'Use the shared currency formatter or configuration.')
    if (
      schema &&
      ts.isPropertyAssignment(node) &&
      ['message', 'invalid_type_error', 'required_error'].includes(
        node.name.getText(ast).replace(/['"]/g, ''),
      ) &&
      (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
    )
      report(node, 'Use validationRefinement with a typed catalog key.')
    if (schema && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text
      const index = [
        'email',
        'url',
        'uuid',
        'cuid',
        'cuid2',
        'ulid',
        'int',
        'positive',
        'negative',
        'nonpositive',
        'nonnegative',
        'finite',
        'safe',
        'nonempty',
      ].includes(name)
        ? 0
        : [
              'min',
              'max',
              'length',
              'refine',
              'multipleOf',
              'regex',
              'gt',
              'gte',
              'lt',
              'lte',
              'startsWith',
              'endsWith',
              'includes',
            ].includes(name)
          ? 1
          : -1
      if (index >= 0 && node.arguments[index] && ts.isStringLiteral(node.arguments[index]))
        report(node, 'Use standard validation metadata or validationRefinement.')
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return violations
}

async function check() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  async function files(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    return (
      await Promise.all(
        entries.map((entry) => {
          const file = path.join(directory, entry.name)
          return entry.isDirectory() ? files(file) : file
        }),
      )
    ).flat()
  }
  const violations = []
  for (const file of (await files(path.join(root, 'apps/web/src'))).filter((file) =>
    /\.tsx?$/.test(file),
  ))
    violations.push(
      ...findConventionViolations(path.relative(root, file), await fs.readFile(file, 'utf8')),
    )
  if (violations.length) throw new Error(violations.join('\n'))
  console.log('Currency, validation metadata and type assertions verified.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await check()
