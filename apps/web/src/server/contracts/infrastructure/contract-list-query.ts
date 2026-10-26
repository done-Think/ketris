import { Prisma } from '@prisma/client'
import type { ContractListFilters, ContractReadScope } from '../types/contract-entity'
import { contractReadWhere } from './contract-query'
import { contractPeriodDates } from './contract-period'

export function contractListQuery(filters: ContractListFilters, scope: ContractReadScope) {
  const conditions: Prisma.Sql[] = []
  const where: Prisma.ContratoWhereInput = {
    AND: [contractReadWhere(scope)],
    status: filters.status,
    tipo: filters.type,
    imovelId: filters.propertyId,
  }
  if (scope.kind === 'party') {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM partes_contrato p JOIN usuarios u ON u.id = p."usuarioId" WHERE p."contratoId" = c.id AND p.papel = 'LOCATARIO' AND p."usuarioId" = ${scope.userId} AND u.ativo = true AND u.papel = 'RENTER')`,
    )
  } else {
    conditions.push(Prisma.sql`c."tenantId" = ${scope.tenantId}`)
    if (scope.kind === 'propertyOwner')
      conditions.push(Prisma.sql`i."proprietarioId" = ${scope.ownerId}`)
    else if (scope.responsibleId)
      conditions.push(Prisma.sql`i."responsavelId" = ${scope.responsibleId}`)
  }
  if (filters.status) conditions.push(Prisma.sql`c.status::text = ${filters.status}`)
  if (filters.type) conditions.push(Prisma.sql`c.tipo::text = ${filters.type}`)
  if (filters.propertyId) conditions.push(Prisma.sql`c."imovelId" = ${filters.propertyId}`)
  const search = filters.search?.trim()
  if (search) {
    where.OR = [
      { codigo: { contains: search, mode: 'insensitive' } },
      { imovel: { titulo: { contains: search, mode: 'insensitive' } } },
      { partes: { some: { nome: { contains: search, mode: 'insensitive' } } } },
    ]
    const term = '%' + search + '%'
    conditions.push(
      Prisma.sql`(c.codigo ILIKE ${term} OR i.titulo ILIKE ${term} OR EXISTS (SELECT 1 FROM partes_contrato p WHERE p."contratoId" = c.id AND p.nome ILIKE ${term}))`,
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
    where.dataFim = { gte: dates.today, lt: end }
    conditions.push(Prisma.sql`c."dataFim" >= ${dates.today} AND c."dataFim" < ${end}`)
  }
  return { where, sql: Prisma.join(conditions, ' AND ') }
}
