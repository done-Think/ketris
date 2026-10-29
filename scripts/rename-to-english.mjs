import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const map = JSON.parse(
  await fs.readFile(path.join(root, 'scripts/english-rename-map.json'), 'utf8'),
)
for (const key of ['models', 'enums', 'physical'])
  map[key] = Object.assign(Object.create(null), map[key])
const write = process.argv.includes('--write')
const sqlOnly = process.argv.includes('--sql-only')
const queriesOnly = process.argv.includes('--queries-only')
if (write && !sqlOnly && !queriesOnly) {
  const active = await fs.readFile(path.join(root, 'apps/web/prisma/schema.prisma'), 'utf8')
  const legacy = await fs.readFile(
    path.join(root, 'apps/web/prisma/english-rename/legacy-schema.prisma'),
    'utf8',
  )
  if (active !== legacy)
    throw new Error(
      'This one-time codemod requires the unchanged legacy schema. Do not reapply it to the renamed application.',
    )
}
const extras = {
  Papel: 'UserRole',
  TenantMemberPapel: 'TenantMemberRole',
  tenantMemberPapelSchema: 'tenantMemberRoleSchema',
  papelSchema: 'userRoleSchema',
  actorPapel: 'actorRole',
  targetPapel: 'targetRole',
  donoEmail: 'ownerEmail',
  participanteEmails: 'participantEmails',
  responsavelNome: 'responsibleName',
  anuncio: 'listing',
  valores: 'values',
  caracteristicas: 'characteristics',
  ATRASADA: 'OVERDUE',
}
const fields = Object.assign(
  Object.create(null),
  Object.fromEntries(
    Object.entries(map.fields)
      .filter(([, values]) => values.length === 1)
      .map(([key, values]) => [key, values[0]]),
  ),
)
const delegates = Object.fromEntries(
  Object.entries(map.models).map(([key, value]) => [
    key[0].toLowerCase() + key.slice(1),
    value[0].toLowerCase() + value.slice(1),
  ]),
)
const identifiers = Object.assign(
  Object.create(null),
  map.models,
  delegates,
  fields,
  map.enums,
  extras,
  map.additionalIdentifiers,
)
const compoundModels = Object.entries(map.models).sort(([a], [b]) => b.length - a.length)
const excluded = [
  '/config/charge-history-fields.ts',
  '/config/maintenance-history-statuses.ts',
  '/tests/utils/charge-history.test.ts',
  '/tests/utils/maintenance-history.test.ts',
  '/tests/infrastructure/maintenance-migrations.integration.test.ts',
]

function ambiguous(word, file, node) {
  if (word === 'destino') return file.includes('/team/') ? 'target' : 'audience'
  if (word !== 'valor') return undefined
  for (let parent = node?.parent; parent; parent = parent.parent) {
    if (ts.isObjectLiteralExpression(parent)) {
      const keys = parent.properties.map((property) => property.name?.getText())
      if (
        keys.some((key) =>
          ['finalidade', 'valorAluguel', 'quartos', 'proprietarioId'].includes(key),
        )
      )
        return 'price'
      if (
        keys.some((key) =>
          ['vencimento', 'diaVencimento', 'dataInicio', 'cobrancaId'].includes(key),
        )
      )
        return 'amount'
    }
    if (ts.isCallExpression(parent)) {
      if (/\.(imovel)\./.test(parent.expression.getText())) return 'price'
      if (/\.(cobranca|contrato)\./.test(parent.expression.getText())) return 'amount'
    }
    if (
      ts.isPropertyAccessExpression(parent) &&
      /\b(imovel|property)\b/.test(parent.expression.getText())
    )
      return 'price'
  }
  return /\/(financial|contracts)\//.test(file) || file.includes('contracts-fixtures')
    ? 'amount'
    : 'price'
}

function identifier(word, file, node) {
  if (
    node &&
    ts.isPropertyAccessExpression(node.parent) &&
    node.parent.name === node &&
    /^(prisma|tx|client)$/.test(node.parent.expression.getText()) &&
    Object.hasOwn(delegates, word)
  )
    return delegates[word]
  const contextual = ambiguous(word, file, node)
  if (contextual) return contextual
  if (identifiers[word]) return identifiers[word]
  let result = word
  for (const [old, next] of compoundModels) result = result.replaceAll(old, next)
  return result.replaceAll('Papel', 'Role')
}

function sql(text, file, context = text) {
  const aliases = new Map()
  for (const match of context.matchAll(
    /\b(?:FROM|JOIN|UPDATE|INTO)\s+"?(\w+)"?(?:\s+(?:AS\s+)?(\w+))?/gi,
  )) {
    if (match[2]) aliases.set(match[2], match[1])
  }
  let result = text.replace(/(\b\w+)\.("?)valor\2/g, (all, alias, quote) => {
    const table = aliases.get(alias)
    const target =
      table === 'imoveis' || table === 'properties'
        ? 'price'
        : table === 'charges' || table === 'contratos' || table === 'contracts'
          ? 'amount'
          : ambiguous('valor', file)
    return `${alias}.${quote}${target}${quote}`
  })
  result = result.replace(
    /\b[A-Za-z_][A-Za-z_0-9]*\b/g,
    (word) =>
      map.physical[word] ?? ambiguous(word, file) ?? fields[word] ?? map.models[word] ?? word,
  )
  return result
}

function string(text, file, node) {
  if (map.models[text] || text === 'Papel') return text
  if (
    /\b(SELECT|INSERT INTO|ALTER TABLE|DELETE FROM|CREATE TABLE|UPDATE)\b/i.test(text) &&
    /\s/.test(text)
  )
    return sql(text, file)
  const direct = ambiguous(text, file, node) ?? identifiers[text] ?? map.physical[text]
  if (direct) return direct
  if (/^[\w.]+$/.test(text))
    return text
      .split('.')
      .map((part) => identifiers[part] ?? part)
      .join('.')
  return query(
    text.replace(
      /([?&])(\w+)=/g,
      (all, separator, key) => `${separator}${identifier(key, file, node)}=`,
    ),
  )
}

function query(text) {
  return text
    .replace(
      /([?&]profile=)(proprietario|corretor|imobiliaria|construtora|locatario)(?=&|$)/g,
      (all, prefix, value) => prefix + (map.additionalIdentifiers[value] ?? fields[value]),
    )
    .replace(
      /([?&](?:status|type|purpose|stage|role|source|category|priority)=)([A-Z_]+)(?=&|$)/g,
      (all, prefix, value) =>
        prefix + (map.enums[value] ?? extras[value] ?? map.physical[value] ?? value),
    )
}

async function files(directory) {
  const result = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await files(name)))
    else result.push(name)
  }
  return result
}

let changed = 0
const targets = [
  ...(await files(path.join(root, 'apps/web/src'))),
  ...(await files(path.join(root, 'apps/web/cypress'))),
  ...(await files(path.join(root, 'apps/web/prisma'))),
  path.join(root, 'apps/web/cypress.config.ts'),
]
for (const file of targets) {
  if (!/\.(ts|tsx)$/.test(file) || excluded.some((suffix) => file.endsWith(suffix))) continue
  const source = await fs.readFile(file, 'utf8')
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const edits = []
  function visit(node) {
    let start = node.getStart(ast)
    let end = node.end
    let old, next
    if (ts.isIdentifier(node) && !sqlOnly && !queriesOnly) {
      old = node.text
      next = identifier(old, file, node)
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      start++
      end--
      old = source.slice(start, end)
      const tagged =
        ts.isTaggedTemplateExpression(node.parent) &&
        /\.(sql|\$(queryRaw|executeRaw))$/.test(node.parent.tag.getText(ast))
      next = queriesOnly
        ? query(old)
        : tagged
          ? sql(old, file, node.parent.getText(ast))
          : sqlOnly
            ? /\b(SELECT|INSERT INTO|ALTER TABLE|DELETE FROM|CREATE TABLE|UPDATE)\b/i.test(old)
              ? sql(old, file)
              : old
            : string(old, file, node)
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      start++
      end -= ts.isTemplateTail(node) ? 1 : 2
      old = source.slice(start, end)
      let template = node.parent
      while (template && !ts.isTaggedTemplateExpression(template)) template = template.parent
      next = queriesOnly
        ? query(old)
        : template && /\.(sql|\$(queryRaw|executeRaw))$/.test(template.tag.getText(ast))
          ? sql(old, file, template.getText(ast))
          : sqlOnly
            ? old
            : string(old, file, node)
    }
    if (old !== undefined && next !== old) edits.push({ start, end, next })
    ts.forEachChild(node, visit)
  }
  visit(ast)
  if (!edits.length) continue
  let result = source
  for (const edit of edits.sort((a, b) => b.start - a.start))
    result = result.slice(0, edit.start) + edit.next + result.slice(edit.end)
  if (write) await fs.writeFile(file, result)
  changed++
}

for (const file of (sqlOnly || queriesOnly
  ? []
  : await files(path.join(root, 'apps/web/src/i18n/messages'))
).filter((name) => name.endsWith('.json'))) {
  const source = await fs.readFile(file, 'utf8')
  function keys(value) {
    if (Array.isArray(value)) return value.map(keys)
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [identifier(key, file), keys(item)]),
      )
    if (typeof value === 'string')
      return value.replace(/\{([A-Za-z_]+)\}/g, (all, name) => `{${identifier(name, file)}}`)
    return value
  }
  const result = JSON.stringify(keys(JSON.parse(source)), null, 2) + '\n'
  if (result === source) continue
  if (write) await fs.writeFile(file, result)
  changed++
}
console.log(
  `${write ? 'Updated' : 'Would update'} ${changed} source files; legacy migrations and audit readers excluded.`,
)
