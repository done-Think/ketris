import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { PublicPropertyRepository } from '../application/ports/public-property-repository.port'
import type {
  PropertySearchFilters,
  PropertySearchPage,
  PropertySearchResult,
} from '../types/property-search'
import type {
  PropertyMedia,
  PublishedPropertyDetail,
  PublishedPropertySummary,
} from '../types/property'
import type {
  DecimalLike,
  PropertyDetailRow,
  PropertySummaryRow,
  PropertyMediaRow,
} from '../types/prisma-public-property-repository'

function toNumber(value: DecimalLike | null): number | null {
  return value === null ? null : value.toNumber()
}

function toSummary(row: PropertySummaryRow): PublishedPropertySummary {
  return {
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    propertyType: row.type,
    price: row.price.toNumber(),
    condoFee: toNumber(row.condoFee),
    propertyTax: toNumber(row.propertyTax),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parkingSpots: row.parkingSpots,
    area: toNumber(row.areaSqm),
    city: row.address?.city ?? null,
    neighborhood: row.address?.neighborhood ?? null,
    latitude: toNumber(row.address?.latitude ?? null),
    longitude: toNumber(row.address?.longitude ?? null),
    brokerName: row.responsible?.name ?? null,
    brokerAvatarUrl: row.responsible?.avatarUrl ?? null,
    coverUrl: row.media[0]?.url ?? null,
    publishedAt: row.publishedAt,
  }
}

function toMedia(row: PropertyMediaRow): PropertyMedia {
  return {
    id: row.id,
    url: row.url,
    type: row.type === 'VIDEO' ? 'video' : row.type === 'FLOOR_PLAN' ? 'floorPlan' : 'photo',
    order: row.position,
  }
}

function toDetail(row: PropertyDetailRow): PublishedPropertyDetail {
  return {
    ...toSummary(row),
    tenantId: row.tenantId,
    description: row.description,
    address: row.address
      ? {
          street: row.address.street,
          number: row.address.number,
          complement: row.address.complement,
          neighborhood: row.address.neighborhood,
          city: row.address.city,
          state: row.address.state,
          zipCode: row.address.zipCode,
          latitude: toNumber(row.address.latitude),
          longitude: toNumber(row.address.longitude),
        }
      : null,
    media: row.media.map(toMedia),
  }
}

const sortOrderBy: Record<
  NonNullable<PropertySearchFilters['sortBy']>,
  Prisma.PropertyOrderByWithRelationInput
> = {
  recent: { publishedAt: 'desc' },
  priceAsc: { price: 'asc' },
  priceDesc: { price: 'desc' },
}

export class PrismaPublicPropertyRepository implements PublicPropertyRepository {
  async search(
    filters: PropertySearchFilters,
    { page, pageSize }: PropertySearchPage,
  ): Promise<PropertySearchResult> {
    const where: Prisma.PropertyWhereInput = { status: 'PUBLISHED' }

    if (filters.purpose) {
      where.purpose = filters.purpose === 'BOTH' ? 'BOTH' : { in: [filters.purpose, 'BOTH'] }
    }
    if (filters.propertyType) where.type = filters.propertyType
    if (filters.minBedrooms !== undefined) where.bedrooms = { gte: filters.minBedrooms }
    if (filters.minArea !== undefined) where.areaSqm = { gte: filters.minArea }
    if (filters.hasParking) where.parkingSpots = { gt: 0 }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      }
    }

    if (filters.city) {
      where.address = { is: { city: { equals: filters.city, mode: 'insensitive' } } }
    }

    if (filters.location) {
      where.address = {
        is: {
          OR: [
            { neighborhood: { contains: filters.location, mode: 'insensitive' } },
            { city: { contains: filters.location, mode: 'insensitive' } },
          ],
        },
      }
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
      ]
    }

    const [properties, totalCount] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        orderBy: [sortOrderBy[filters.sortBy ?? 'recent'], { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          purpose: true,
          type: true,
          price: true,
          condoFee: true,
          propertyTax: true,
          bedrooms: true,
          bathrooms: true,
          parkingSpots: true,
          areaSqm: true,
          publishedAt: true,
          address: { select: { city: true, neighborhood: true, latitude: true, longitude: true } },
          responsible: { select: { name: true, avatarUrl: true } },
          media: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
        },
      }),
      prisma.property.count({ where }),
    ])

    return {
      items: properties.map((property) => toSummary(property)),
      totalCount,
    }
  }

  async findPublishedById(id: string): Promise<PublishedPropertyDetail | null> {
    const property = await prisma.property.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: {
        address: true,
        responsible: { select: { name: true, avatarUrl: true } },
        media: { orderBy: { position: 'asc' } },
      },
    })

    return property ? toDetail(property) : null
  }
}
