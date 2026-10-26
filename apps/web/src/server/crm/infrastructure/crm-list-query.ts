import en from '@/i18n/messages/en-US/crm.json'
import es from '@/i18n/messages/es-ES/crm.json'
import pt from '@/i18n/messages/pt-BR/crm.json'
import { Prisma } from '@prisma/client'
import { CRM_STATUS_KEYS } from '../constants/translation-keys'
import type { CrmListKind, CrmListQueryFilters, CrmListSql } from '../types/list-query'
import type { CrmScope } from '../types/prisma'

const dictionaries = { 'pt-BR': pt, 'en-US': en, 'es-ES': es }
const join = (parts: Prisma.Sql[]) => Prisma.join(parts, ' AND ')

function normalizedSql(expression: Prisma.Sql) {
  return Prisma.sql`lower(translate(${expression}, 'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇçÑñ', 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'))`
}
function normalized(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
function enumOrder(column: Prisma.Sql, labels: Record<string, string>, locale: string) {
  return Prisma.sql`CASE ${column}::text ${Prisma.join(
    Object.keys(labels)
      .sort((a, b) => labels[a].localeCompare(labels[b], locale))
      .map((code, index) => Prisma.sql`WHEN ${code} THEN ${index}`),
    ' ',
  )} END`
}

export function crmListSql(
  kind: CrmListKind,
  scope: CrmScope,
  filters: CrmListQueryFilters,
): CrmListSql {
  const base = [Prisma.sql`r."tenantId" = ${scope.actorTenantId}`]
  const extra: Prisma.Sql[] = []
  const messages = dictionaries[filters.locale ?? 'pt-BR']
  let from: Prisma.Sql,
    group: Prisma.Sql,
    amount = Prisma.sql`0`,
    purpose = Prisma.sql`NULL::text`
  let searchable: Prisma.Sql[]
  let columns: Record<string, Prisma.Sql>
  if (kind === 'contact') {
    from = Prisma.sql`contatos r`
    group = Prisma.sql`r.tipo::text`
    if (!filters.includeArchived) base.push(Prisma.sql`r."arquivadoEm" IS NULL`)
    if (scope.actorPapel === 'AGENT')
      base.push(
        Prisma.sql`(r."createdById" = ${scope.actorId ?? ''} OR EXISTS (SELECT 1 FROM oportunidades o JOIN imoveis i ON i.id = o."imovelId" WHERE o."contatoId" = r.id AND o."tenantId" = ${scope.actorTenantId} AND i."responsavelId" = ${scope.actorId ?? ''}))`,
      )
    if (filters.type) extra.push(Prisma.sql`r.tipo::text = ${filters.type}`)
    searchable = [Prisma.sql`r.nome`, Prisma.sql`r.email`, Prisma.sql`r.telefone`]
    columns = {
      name: Prisma.sql`r.nome`,
      lastInteraction: Prisma.sql`r."ultimaInteracao"`,
      createdAt: Prisma.sql`r."createdAt"`,
      type: enumOrder(
        Prisma.sql`r.tipo`,
        {
          LOCATARIO: messages.contacts.types.tenant,
          PROPRIETARIO: messages.contacts.types.owner,
          CORRETOR: messages.contacts.types.broker,
        },
        filters.locale ?? 'pt-BR',
      ),
    }
  } else if (kind === 'lead') {
    from = Prisma.sql`leads r JOIN usuarios u ON u.id = r."responsavelId"`
    group = Prisma.sql`r.estagio::text`
    if (scope.actorPapel === 'AGENT')
      base.push(Prisma.sql`r."responsavelId" = ${scope.actorId ?? ''}`)
    if (filters.stage) extra.push(Prisma.sql`r.estagio::text = ${filters.stage}`)
    searchable = [
      Prisma.sql`r.nome`,
      Prisma.sql`r.interesse`,
      Prisma.sql`r.origem`,
      Prisma.sql`u.nome`,
    ]
    const token = Prisma.sql`substring(r.orcamento from '[0-9]+[0-9.,]*')`
    const suffixed = Prisma.sql`r.orcamento ~* '[0-9][[:space:]]*[mk]'`
    const numericText = Prisma.sql`CASE WHEN ${suffixed} THEN replace(${token}, ',', '.') ELSE replace(replace(${token}, '.', ''), ',', '.') END`
    const budget = Prisma.sql`CASE WHEN ${numericText} ~ '^[0-9]+([.][0-9]+)?$' THEN (${numericText})::numeric * CASE WHEN r.orcamento ~* '[0-9][[:space:]]*m' THEN 1000000 WHEN r.orcamento ~* '[0-9][[:space:]]*k' THEN 1000 ELSE 1 END ELSE 0 END`
    columns = {
      name: Prisma.sql`r.nome`,
      interest: Prisma.sql`r.interesse`,
      budget,
      stage: Prisma.sql`r.estagio`,
      source: Prisma.sql`r.origem`,
      lastContact: Prisma.sql`r."updatedAt"`,
      createdAt: Prisma.sql`r."createdAt"`,
    }
  } else {
    from = Prisma.sql`oportunidades r JOIN imoveis i ON i.id = r."imovelId" LEFT JOIN enderecos e ON e."imovelId" = i.id`
    group = Prisma.sql`r.status::text`
    amount = Prisma.sql`r."valorProposto"`
    purpose = Prisma.sql`i.finalidade::text`
    if (!filters.includeArchived) base.push(Prisma.sql`r."arquivadaEm" IS NULL`)
    if (scope.actorPapel === 'AGENT')
      base.push(Prisma.sql`i."responsavelId" = ${scope.actorId ?? ''}`)
    if (filters.status) extra.push(Prisma.sql`r.status::text = ${filters.status}`)
    if (filters.statuses?.length)
      extra.push(Prisma.sql`r.status::text IN (${Prisma.join(filters.statuses)})`)
    if (filters.contactId) extra.push(Prisma.sql`r."contatoId" = ${filters.contactId}`)
    const labels = Object.fromEntries(
      Object.entries(CRM_STATUS_KEYS).map(([code, key]) => [
        code,
        messages.opportunityDetail.statuses[key],
      ]),
    )
    searchable = [
      Prisma.sql`r.id`,
      Prisma.sql`r."interessadoNome"`,
      Prisma.sql`r."interessadoEmail"`,
      Prisma.sql`r."interessadoTelefone"`,
      Prisma.sql`i.titulo`,
      Prisma.sql`i.tipo::text`,
      Prisma.sql`i.id`,
      Prisma.sql`e.bairro`,
      Prisma.sql`e.cidade`,
      Prisma.sql`e.logradouro`,
      Prisma.sql`r."valorProposto"::text`,
    ]
    const matchingStatuses = Object.entries(labels)
      .filter(([, label]) => normalized(label).includes(normalized(filters.q?.trim() ?? '')))
      .map(([code]) => code)
    if (filters.q?.trim() && matchingStatuses.length)
      searchable.push(
        Prisma.sql`CASE WHEN r.status::text IN (${Prisma.join(matchingStatuses)}) THEN ${filters.q.trim()} ELSE '' END`,
      )
    columns = {
      name: Prisma.sql`r."interessadoNome"`,
      property: Prisma.sql`i.titulo`,
      proposedValue: amount,
      status: enumOrder(Prisma.sql`r.status`, labels, filters.locale ?? 'pt-BR'),
      createdAt: Prisma.sql`r."createdAt"`,
      updatedAt: Prisma.sql`r."updatedAt"`,
    }
  }
  if (filters.q?.trim()) {
    const term = '%' + normalized(filters.q.trim()).replace(/[\\%_]/g, '\\$&') + '%'
    extra.push(
      Prisma.sql`(${Prisma.join(
        searchable.map((column) => Prisma.sql`${normalizedSql(column)} LIKE ${term}`),
        ' OR ',
      )})`,
    )
  }
  const defaultSort = kind === 'contact' ? 'name' : 'createdAt'
  const sortKey = filters.sortBy ?? defaultSort
  const sortColumn = columns[sortKey] ?? columns[defaultSort]
  const sort = ['name', 'property', 'interest', 'source'].includes(sortKey)
    ? normalizedSql(sortColumn)
    : sortColumn
  const direction =
    filters.sortDirection === 'asc' || (!filters.sortBy && kind === 'contact')
      ? Prisma.sql`ASC`
      : Prisma.sql`DESC`
  return {
    from,
    base: join(base),
    filter: join([...base, ...extra]),
    order: Prisma.sql`${sort} ${direction} NULLS LAST, r."createdAt" DESC, r.id ASC`,
    group,
    amount,
    purpose,
  }
}
