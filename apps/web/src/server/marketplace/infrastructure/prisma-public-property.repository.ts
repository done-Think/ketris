import { prisma } from '@server/db/prisma'
import { publicPropertySearchPage } from './public-property-search-page'

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
    rentalPrice: row.rentalPrice?.toNumber() ?? null,
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

export class PrismaPublicPropertyRepository implements PublicPropertyRepository {
  async search(
    filters: PropertySearchFilters,
    { page, pageSize }: PropertySearchPage,
  ): Promise<PropertySearchResult> {
    return prisma.$transaction(
      async (transaction) => {
        const { ids, totalCount } = await publicPropertySearchPage(transaction, filters, {
          page,
          pageSize,
        })
        const properties = await transaction.property.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            title: true,
            purpose: true,
            type: true,
            price: true,
            rentalPrice: true,
            condoFee: true,
            propertyTax: true,
            bedrooms: true,
            bathrooms: true,
            parkingSpots: true,
            areaSqm: true,
            publishedAt: true,
            address: {
              select: { city: true, neighborhood: true, latitude: true, longitude: true },
            },
            responsible: { select: { name: true, avatarUrl: true } },
            media: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
          },
        })
        const byId = new Map(properties.map((property) => [property.id, property]))
        return {
          items: ids.flatMap((id) => {
            const property = byId.get(id)
            return property ? [toSummary(property)] : []
          }),
          totalCount,
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
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
