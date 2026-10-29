import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const map = JSON.parse(
  await fs.readFile(path.join(root, 'scripts/english-rename-map.json'), 'utf8'),
)
const oldNames = new Set([
  ...Object.keys(map.models),
  ...Object.keys(map.fields),
  ...Object.keys(map.enums),
  ...Object.keys(map.additionalIdentifiers),
  'Papel',
  'actorPapel',
  'ACEITAR',
  'RECUSAR',
  'SOLICITAR_INFORMACOES',
])
const oldEnumValues = new Set([
  ...Object.keys(map.enums),
  ...Object.keys(map.physical).filter((word) => /^[A-Z_]+$/.test(word)),
  'ATRASADA',
  'ACEITAR',
  'RECUSAR',
  'SOLICITAR_INFORMACOES',
])
const auditReaders = new Set([
  'charge-history-fields.ts',
  'maintenance-history-statuses.ts',
  'charge-history.test.ts',
  'maintenance-history.test.ts',
])
const jwtReaders = new Set([
  'access-token.schema.ts',
  'auth-options.ts',
  'auth-options.test.ts',
  'jose-token.service.test.ts',
])
const oldClientTokens = new Set(['titulo', 'finalidade', 'tipo', 'valor', 'VENDA', 'CASA'])
// ViaCEP's wire format is outside our control. Only these two external keys are exempt,
// and only at its parsing/mapping boundary and the corresponding provider fixtures.
const postalCodeBoundaryFiles = new Set([
  'apps/web/src/modules/properties/schemas/postal-code-schema.ts',
  'apps/web/src/modules/properties/services/postal-code-service.ts',
  'apps/web/src/modules/properties/tests/services/postal-code-service.test.ts',
])
const postalCodeWireTokens = new Set(['logradouro', 'bairro'])
const legacyOpportunityActions = new Set(['ACEITAR', 'RECUSAR', 'SOLICITAR_INFORMACOES'])
const opportunityActionCompatibilityFiles = new Set([
  'apps/web/src/shared/config/opportunity-response-actions.ts',
  'apps/web/src/server/crm/tests/schemas/opportunity-response-actions.test.ts',
  'apps/web/src/app/api/crm/tests/opportunities/[id]/respond/route.integration.test.ts',
])
const violations = []

async function files(directory) {
  const result = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await files(file)))
    else result.push(file)
  }
  return result
}

function allowed(file, token, literal) {
  const basename = path.basename(file)
  return (
    (opportunityActionCompatibilityFiles.has(path.relative(root, file)) &&
      legacyOpportunityActions.has(token)) ||
    (postalCodeBoundaryFiles.has(path.relative(root, file)) && postalCodeWireTokens.has(token)) ||
    basename === 'maintenance-migrations.integration.test.ts' ||
    (literal && auditReaders.has(basename)) ||
    (token === 'papel' && jwtReaders.has(basename)) ||
    (basename === 'api-contract.cy.ts' && oldClientTokens.has(token))
  )
}

const targets = [
  ...(await files(path.join(root, 'apps/web/src'))),
  ...(await files(path.join(root, 'apps/web/cypress'))),
  ...(await files(path.join(root, 'apps/web/prisma'))),
  path.join(root, 'apps/web/cypress.config.ts'),
]
for (const file of targets.filter((name) => /\.(ts|tsx|json)$/.test(name))) {
  const source = await fs.readFile(file, 'utf8')
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.json')
      ? ts.ScriptKind.JSON
      : file.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS,
  )
  const report = (node, token, literal) => {
    if (allowed(file, token, literal)) return
    const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1
    violations.push(`${path.relative(root, file)}:${line}: ${token}`)
  }
  function visit(node) {
    if (ts.isIdentifier(node) && oldNames.has(node.text)) report(node, node.text, false)
    if (ts.isStringLiteral(node)) {
      for (const match of node.text.matchAll(
        /[?&]profile=(proprietario|corretor|imobiliaria|construtora|locatario)(?=&|$)/g,
      ))
        report(node, match[1], true)
      if (!file.includes('/i18n/messages/') && oldEnumValues.has(node.text))
        report(node, node.text, true)
      if (
        file.endsWith('.json') &&
        ts.isPropertyAssignment(node.parent) &&
        node.parent.name === node &&
        oldNames.has(node.text)
      )
        report(node, node.text, false)
    }
    if (
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      let parent = node.parent
      while (parent && !ts.isTaggedTemplateExpression(parent)) parent = parent.parent
      if (parent && /\.(sql|\$(queryRaw|executeRaw))$/.test(parent.tag.getText(ast))) {
        for (const token of node.text.match(/[A-Za-z_][A-Za-z_0-9]*/g) ?? [])
          if (oldNames.has(token) || Object.hasOwn(map.physical, token)) report(node, token, true)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
}
const schema = await fs.readFile(path.join(root, 'apps/web/prisma/schema.prisma'), 'utf8')
for (const token of schema.replace(/\/\/[^\n]*/g, '').match(/[A-Za-z_][A-Za-z_0-9]*/g) ?? [])
  if (oldNames.has(token) || Object.hasOwn(map.physical, token))
    violations.push(`apps/web/prisma/schema.prisma: ${token}`)
if (violations.length) {
  console.error(violations.slice(0, 60).join('\n'))
  throw new Error(`${violations.length} legacy names outside the documented compatibility paths.`)
}
console.log(
  'English identifiers, API enum literals, frontend translation keys and raw SQL verified.',
)
