import { Prisma } from '@prisma/client'

import { matchingPropertyTypes } from '../domain/property-search'
import { getPropertyLabelOrder, propertyDatabaseStatus } from './property-label-order'
import type { PropertyListFilters } from '../types/property'
import type { PropertyIdRow, PropertyTransaction } from '../types/prisma-property-repository'

export async function findPropertyIdsInDisplayOrder(
  transaction: PropertyTransaction,
  filters: PropertyListFilters,
): Promise<string[]> {
  const conditions = [Prisma.sql`i."tenantId" = ${filters.tenantId}`]
  if (filters.responsavelId)
    conditions.push(Prisma.sql`i."responsavelId" = ${filters.responsavelId}`)
  if (filters.proprietarioId)
    conditions.push(Prisma.sql`i."proprietarioId" = ${filters.proprietarioId}`)
  if (filters.status)
    conditions.push(Prisma.sql`i.status::text = ${propertyDatabaseStatus[filters.status]}`)
  if (filters.finalidade) conditions.push(Prisma.sql`i.finalidade::text = ${filters.finalidade}`)
  if (filters.renterId)
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM contratos c JOIN partes_contrato p ON p."contratoId" = c.id WHERE c."imovelId" = i.id AND c."tenantId" = ${filters.tenantId} AND c.status = 'ATIVO' AND p.papel = 'LOCATARIO' AND p."usuarioId" = ${filters.renterId})`,
    )
  if (filters.search) {
    const term = `%${filters.search}%`
    const types = matchingPropertyTypes(filters.search)
    const parts = filters.search.split(',').map((part) => part.trim())
    const matches = [
      Prisma.sql`i.titulo ILIKE ${term}`,
      Prisma.sql`e.logradouro ILIKE ${term}`,
      Prisma.sql`e.numero LIKE ${term}`,
      Prisma.sql`e.bairro ILIKE ${term}`,
      Prisma.sql`e.cidade ILIKE ${term}`,
      Prisma.sql`u.nome ILIKE ${term}`,
    ]
    if (types.length) matches.push(Prisma.sql`i.tipo::text IN (${Prisma.join(types)})`)
    if (parts.length === 2) {
      matches.push(
        Prisma.sql`(e.logradouro ILIKE ${`%${parts[0]}%`} AND e.numero LIKE ${`%${parts[1]}%`})`,
      )
      matches.push(
        Prisma.sql`(e.bairro ILIKE ${`%${parts[0]}%`} AND e.cidade ILIKE ${`%${parts[1]}%`})`,
      )
    }
    conditions.push(Prisma.sql`(${Prisma.join(matches, ' OR ')})`)
  }
  const price =
    filters.sortBy === 'saleValue'
      ? Prisma.sql`CASE WHEN i.finalidade IN ('VENDA', 'AMBOS') THEN i.valor ELSE NULL END`
      : Prisma.sql`CASE WHEN i.finalidade = 'ALUGUEL' THEN i.valor WHEN i.finalidade = 'AMBOS' THEN i."valorAluguel" ELSE NULL END`
  const sortColumn = filters.sortBy === 'type' ? Prisma.sql`i.tipo` : Prisma.sql`i.status`
  const orderedLabels = getPropertyLabelOrder(filters)
  const order =
    filters.sortBy === 'type' || filters.sortBy === 'status'
      ? Prisma.sql`CASE ${sortColumn}::text ${Prisma.join(
          orderedLabels.map((value, index) => Prisma.sql`WHEN ${value} THEN ${index}`),
          ' ',
        )} END`
      : price
  const direction = filters.sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
  const page = filters.page ?? 1
  const size = filters.pageSize ?? 25
  const rows = await transaction.$queryRaw<PropertyIdRow[]>(Prisma.sql`
    SELECT i.id FROM imoveis i
    LEFT JOIN enderecos e ON e."imovelId" = i.id
    JOIN usuarios u ON u.id = i."responsavelId"
    WHERE ${Prisma.join(conditions, ' AND ')}
    ORDER BY ${order} ${direction} NULLS LAST, i.id ASC
    LIMIT ${size} OFFSET ${(page - 1) * size}
  `)
  return rows.map((row) => row.id)
}
