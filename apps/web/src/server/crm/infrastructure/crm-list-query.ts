import en from '@/i18n/messages/en-US/crm.json'
import es from '@/i18n/messages/es-ES/crm.json'
import pt from '@/i18n/messages/pt-BR/crm.json'
import { Prisma } from '@prisma/client'
import { LEAD_SOURCE_KEYS, LEAD_SOURCES } from '../constants/lead-sources'
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
    from = Prisma.sql`contacts r`
    group = Prisma.sql`r.type::text`
    if (!filters.includeArchived) base.push(Prisma.sql`r."archivedAt" IS NULL`)
    if (scope.actorRole === 'AGENT')
      base.push(
        Prisma.sql`(r."createdById" = ${scope.actorId ?? ''} OR EXISTS (SELECT 1 FROM opportunities o WHERE o."contactId" = r.id AND o."tenantId" = ${scope.actorTenantId} AND o."responsibleId" = ${scope.actorId ?? ''}))`,
      )
    if (filters.type) extra.push(Prisma.sql`r.type::text = ${filters.type}`)
    searchable = [Prisma.sql`r.name`, Prisma.sql`r.email`, Prisma.sql`r.phone`]
    columns = {
      name: Prisma.sql`r.name`,
      lastInteraction: Prisma.sql`r."lastInteraction"`,
      createdAt: Prisma.sql`r."createdAt"`,
      type: enumOrder(
        Prisma.sql`r.type`,
        {
          RENTER: messages.contacts.types.tenant,
          OWNER: messages.contacts.types.owner,
          BROKER: messages.contacts.types.broker,
        },
        filters.locale ?? 'pt-BR',
      ),
    }
  } else if (kind === 'lead') {
    from = Prisma.sql`leads r JOIN users u ON u.id = r."responsibleId"`
    group = Prisma.sql`r.stage::text`
    if (scope.actorRole === 'AGENT')
      base.push(Prisma.sql`r."responsibleId" = ${scope.actorId ?? ''}`)
    if (filters.stage) extra.push(Prisma.sql`r.stage::text = ${filters.stage}`)
    const sourceLabels = Object.fromEntries(
      LEAD_SOURCES.map((code) => [code, messages.leads.create.sources[LEAD_SOURCE_KEYS[code]]]),
    )
    const sourceLabel = Prisma.sql`CASE r.source::text ${Prisma.join(
      LEAD_SOURCES.map((code) => Prisma.sql`WHEN ${code} THEN ${sourceLabels[code]}`),
      ' ',
    )} END`
    searchable = [Prisma.sql`r.name`, Prisma.sql`r.interest`, sourceLabel, Prisma.sql`u.name`]
    const token = Prisma.sql`substring(r.budget from '[0-9]+[0-9.,]*')`
    const suffixed = Prisma.sql`r.budget ~* '[0-9][[:space:]]*[mk]'`
    const numericText = Prisma.sql`CASE WHEN ${suffixed} THEN replace(${token}, ',', '.') ELSE replace(replace(${token}, '.', ''), ',', '.') END`
    const budget = Prisma.sql`CASE WHEN ${numericText} ~ '^[0-9]+([.][0-9]+)?$' THEN (${numericText})::numeric * CASE WHEN r.budget ~* '[0-9][[:space:]]*m' THEN 1000000 WHEN r.budget ~* '[0-9][[:space:]]*k' THEN 1000 ELSE 1 END ELSE 0 END`
    columns = {
      name: Prisma.sql`r.name`,
      interest: Prisma.sql`r.interest`,
      budget,
      stage: Prisma.sql`r.stage`,
      source: enumOrder(Prisma.sql`r.source`, sourceLabels, filters.locale ?? 'pt-BR'),
      lastContact: Prisma.sql`r."updatedAt"`,
      createdAt: Prisma.sql`r."createdAt"`,
    }
  } else {
    from = Prisma.sql`opportunities r JOIN properties i ON i.id = r."propertyId" LEFT JOIN property_addresses e ON e."propertyId" = i.id`
    group = Prisma.sql`r.status::text`
    amount = Prisma.sql`r."proposedValue"`
    purpose = Prisma.sql`i.purpose::text`
    if (!filters.includeArchived) base.push(Prisma.sql`r."archivedAt" IS NULL`)
    if (scope.actorRole === 'AGENT')
      base.push(Prisma.sql`r."responsibleId" = ${scope.actorId ?? ''}`)
    if (filters.status) extra.push(Prisma.sql`r.status::text = ${filters.status}`)
    if (filters.statuses?.length)
      extra.push(Prisma.sql`r.status::text IN (${Prisma.join(filters.statuses)})`)
    if (filters.contactId) extra.push(Prisma.sql`r."contactId" = ${filters.contactId}`)
    const labels = Object.fromEntries(
      Object.entries(CRM_STATUS_KEYS).map(([code, key]) => [
        code,
        messages.opportunityDetail.statuses[key],
      ]),
    )
    searchable = [
      Prisma.sql`r.id`,
      Prisma.sql`r."interestedName"`,
      Prisma.sql`r."interestedEmail"`,
      Prisma.sql`r."interestedPhone"`,
      Prisma.sql`i.title`,
      Prisma.sql`i.type::text`,
      Prisma.sql`i.id`,
      Prisma.sql`e.neighborhood`,
      Prisma.sql`e.city`,
      Prisma.sql`e.street`,
      Prisma.sql`r."proposedValue"::text`,
    ]
    const matchingStatuses = Object.entries(labels)
      .filter(([, label]) => normalized(label).includes(normalized(filters.q?.trim() ?? '')))
      .map(([code]) => code)
    if (filters.q?.trim() && matchingStatuses.length)
      searchable.push(
        Prisma.sql`CASE WHEN r.status::text IN (${Prisma.join(matchingStatuses)}) THEN ${filters.q.trim()} ELSE '' END`,
      )
    columns = {
      name: Prisma.sql`r."interestedName"`,
      property: Prisma.sql`i.title`,
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
  const sort = ['name', 'property', 'interest'].includes(sortKey)
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
