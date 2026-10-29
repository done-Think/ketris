import { Prisma } from '@prisma/client'
import type { ContractListFilters, ContractReadScope } from '../types/contract-entity'
import { contractReadWhere } from './contract-query'
import { contractPeriodDates } from './contract-period'

export function contractListQuery(filters: ContractListFilters, scope: ContractReadScope) {
  const conditions: Prisma.Sql[] = []
  const where: Prisma.ContractWhereInput = {
    AND: [contractReadWhere(scope)],
    status: filters.status,
    type: filters.type,
    propertyId: filters.propertyId,
  }
  if (scope.kind === 'party') {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM contract_parties p JOIN users u ON u.id = p."userId" WHERE p."contractId" = c.id AND p.role = 'RENTER' AND p."userId" = ${scope.userId} AND u.active = true AND u.role = 'RENTER')`,
    )
  } else {
    conditions.push(Prisma.sql`c."tenantId" = ${scope.tenantId}`)
    if (scope.kind === 'propertyOwner') conditions.push(Prisma.sql`i."ownerId" = ${scope.ownerId}`)
    else if (scope.responsibleId)
      conditions.push(Prisma.sql`i."responsibleId" = ${scope.responsibleId}`)
  }
  if (filters.status) conditions.push(Prisma.sql`c.status::text = ${filters.status}`)
  if (filters.type) conditions.push(Prisma.sql`c.type::text = ${filters.type}`)
  if (filters.propertyId) conditions.push(Prisma.sql`c."propertyId" = ${filters.propertyId}`)
  const search = filters.search?.trim()
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { property: { title: { contains: search, mode: 'insensitive' } } },
      { parties: { some: { name: { contains: search, mode: 'insensitive' } } } },
    ]
    const term = '%' + search + '%'
    conditions.push(
      Prisma.sql`(c.code ILIKE ${term} OR i.title ILIKE ${term} OR EXISTS (SELECT 1 FROM contract_parties p WHERE p."contractId" = c.id AND p.name ILIKE ${term}))`,
    )
  }
  const dates = contractPeriodDates()
  const end =
    filters.period === 'THIS_MONTH'
      ? dates.nextMonth
      : filters.period === 'NEXT_90_DAYS'
        ? dates.after90
        : null
  if (end) {
    where.endDate = { gte: dates.today, lt: end }
    conditions.push(Prisma.sql`c."endDate" >= ${dates.today} AND c."endDate" < ${end}`)
  }
  return { where, sql: Prisma.join(conditions, ' AND ') }
}
