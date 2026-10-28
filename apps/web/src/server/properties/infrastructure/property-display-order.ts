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
  if (filters.responsibleId)
    conditions.push(Prisma.sql`i."responsibleId" = ${filters.responsibleId}`)
  if (filters.ownerId) conditions.push(Prisma.sql`i."ownerId" = ${filters.ownerId}`)
  if (filters.status)
    conditions.push(Prisma.sql`i.status::text = ${propertyDatabaseStatus[filters.status]}`)
  if (filters.purpose) conditions.push(Prisma.sql`i.purpose::text = ${filters.purpose}`)
  if (filters.renterId)
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM contracts c JOIN contract_parties p ON p."contractId" = c.id WHERE c."propertyId" = i.id AND c."tenantId" = ${filters.tenantId} AND c.status = 'ACTIVE' AND p.role = 'RENTER' AND p."userId" = ${filters.renterId})`,
    )
  if (filters.search) {
    const term = `%${filters.search}%`
    const types = matchingPropertyTypes(filters.search)
    const parts = filters.search.split(',').map((part) => part.trim())
    const matches = [
      Prisma.sql`i.title ILIKE ${term}`,
      Prisma.sql`e.street ILIKE ${term}`,
      Prisma.sql`e.number LIKE ${term}`,
      Prisma.sql`e.neighborhood ILIKE ${term}`,
      Prisma.sql`e.city ILIKE ${term}`,
      Prisma.sql`u.name ILIKE ${term}`,
    ]
    if (types.length) matches.push(Prisma.sql`i.type::text IN (${Prisma.join(types)})`)
    if (parts.length === 2) {
      matches.push(
        Prisma.sql`(e.street ILIKE ${`%${parts[0]}%`} AND e.number LIKE ${`%${parts[1]}%`})`,
      )
      matches.push(
        Prisma.sql`(e.neighborhood ILIKE ${`%${parts[0]}%`} AND e.city ILIKE ${`%${parts[1]}%`})`,
      )
    }
    conditions.push(Prisma.sql`(${Prisma.join(matches, ' OR ')})`)
  }
  const price =
    filters.sortBy === 'saleValue'
      ? Prisma.sql`CASE WHEN i.purpose IN ('SALE', 'BOTH') THEN i.price ELSE NULL END`
      : Prisma.sql`CASE WHEN i.purpose = 'RENT' THEN i.price WHEN i.purpose = 'BOTH' THEN i."rentalPrice" ELSE NULL END`
  const sortColumn = filters.sortBy === 'type' ? Prisma.sql`i.type` : Prisma.sql`i.status`
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
    SELECT i.id FROM properties i
    LEFT JOIN property_addresses e ON e."propertyId" = i.id
    JOIN users u ON u.id = i."responsibleId"
    WHERE ${Prisma.join(conditions, ' AND ')}
    ORDER BY ${order} ${direction} NULLS LAST, i.id ASC
    LIMIT ${size} OFFSET ${(page - 1) * size}
  `)
  return rows.map((row) => row.id)
}
