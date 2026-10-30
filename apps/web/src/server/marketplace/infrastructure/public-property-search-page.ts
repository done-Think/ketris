import { Prisma } from '@prisma/client'
import type { PropertySearchFilters, PropertySearchPage } from '../types/property-search'

export async function publicPropertySearchPage(
  db: Pick<Prisma.TransactionClient, '$queryRaw'>,
  filters: PropertySearchFilters,
  { page, pageSize }: PropertySearchPage,
) {
  const price =
    filters.purpose === 'RENT'
      ? Prisma.sql`CASE WHEN p.purpose = 'BOTH' THEN p."rentalPrice" ELSE p.price END`
      : Prisma.sql`p.price`
  const clauses = [Prisma.sql`p.status = 'PUBLISHED'`]
  if (filters.purpose === 'RENT') {
    clauses.push(Prisma.sql`(p.purpose = 'RENT' OR (p.purpose = 'BOTH' AND p."rentalPrice" > 0))`)
  } else if (filters.purpose) {
    clauses.push(
      filters.purpose === 'BOTH'
        ? Prisma.sql`p.purpose = 'BOTH'`
        : Prisma.sql`p.purpose IN ('SALE', 'BOTH')`,
    )
  }
  if (filters.propertyType)
    clauses.push(Prisma.sql`p.type = ${filters.propertyType}::"PropertyType"`)
  if (filters.minBedrooms !== undefined)
    clauses.push(Prisma.sql`p.bedrooms >= ${filters.minBedrooms}`)
  if (filters.minArea !== undefined) clauses.push(Prisma.sql`p."areaSqm" >= ${filters.minArea}`)
  if (filters.hasParking) clauses.push(Prisma.sql`p."parkingSpots" > 0`)
  if (filters.minPrice !== undefined) clauses.push(Prisma.sql`${price} >= ${filters.minPrice}`)
  if (filters.maxPrice !== undefined) clauses.push(Prisma.sql`${price} <= ${filters.maxPrice}`)
  if (filters.city) clauses.push(Prisma.sql`lower(btrim(a.city)) = lower(${filters.city.trim()})`)
  for (const part of filters.location
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? []) {
    const term = `%${part}%`
    clauses.push(Prisma.sql`(a.neighborhood ILIKE ${term} OR a.city ILIKE ${term})`)
  }
  if (filters.q) {
    const term = `%${filters.q}%`
    clauses.push(Prisma.sql`(p.title ILIKE ${term} OR p.description ILIKE ${term})`)
  }
  const where = Prisma.join(clauses, ' AND ')
  const order =
    filters.sortBy === 'priceAsc'
      ? Prisma.sql`${price} ASC NULLS LAST, p.id ASC`
      : filters.sortBy === 'priceDesc'
        ? Prisma.sql`${price} DESC NULLS LAST, p.id ASC`
        : Prisma.sql`p."publishedAt" DESC, p.id ASC`
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT p.id FROM properties p
    LEFT JOIN property_addresses a ON a."propertyId" = p.id
    WHERE ${where} ORDER BY ${order}
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`
  const counts = await db.$queryRaw<{ total: bigint }[]>`
    SELECT count(*) AS total FROM properties p
    LEFT JOIN property_addresses a ON a."propertyId" = p.id
    WHERE ${where}`
  return { ids: rows.map((row) => row.id), totalCount: Number(counts[0]?.total ?? 0) }
}
