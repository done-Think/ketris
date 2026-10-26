import { Prisma } from '@prisma/client'
import type { CrmListKind, CrmListQueryFilters, CrmPageIds, CrmSqlGroup } from '../types/list-query'
import type { CrmDatabase, CrmScope } from '../types/prisma'
import { crmListSql } from './crm-list-query'

export async function readCrmPage(
  db: CrmDatabase,
  scope: CrmScope,
  kind: CrmListKind,
  filters: CrmListQueryFilters = {},
): Promise<CrmPageIds> {
  const query = crmListSql(kind, scope, filters)
  const [count] = await db.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`SELECT count(*) AS total FROM ${query.from} WHERE ${query.filter}`,
  )
  const totalCount = Number(count.total)
  const pageSize = filters.pageSize ?? 5
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = Math.min(filters.page ?? 1, pageCount)
  const rows = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT r.id FROM ${query.from} WHERE ${query.filter} ORDER BY ${query.order} OFFSET ${(page - 1) * pageSize} LIMIT ${pageSize}`,
  )
  const groups = await db.$queryRaw<
    CrmSqlGroup[]
  >(Prisma.sql`SELECT ${query.group} AS key, count(*) AS count, coalesce(sum(${query.amount}), 0) AS amount,
    coalesce(sum(${query.amount}) FILTER (WHERE ${query.purpose} = 'ALUGUEL'), 0) AS rental,
    coalesce(sum(${query.amount}) FILTER (WHERE ${query.purpose} = 'VENDA'), 0) AS sale,
    coalesce(sum(${query.amount}) FILTER (WHERE ${query.purpose} NOT IN ('ALUGUEL', 'VENDA')), 0) AS unclassified
    FROM ${query.from} WHERE ${filters.summaryScope === 'results' ? query.filter : query.base} GROUP BY ${query.group}`)
  return {
    ids: rows.map((row) => row.id),
    pagination: { page, pageSize, pageCount, totalCount },
    groups: groups.map((group) => ({
      key: group.key,
      count: Number(group.count),
      amount: Number(group.amount),
      rental: Number(group.rental),
      sale: Number(group.sale),
      unclassified: Number(group.unclassified),
    })),
  }
}
