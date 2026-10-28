import type { Prisma } from '@prisma/client'
import type { CrmPropertyRow } from '../types/prisma-property'
import type { CrmPropertyDetail } from '../types/property'

export const crmPropertyInclude = {
  address: true,
  responsible: { select: { name: true, avatarUrl: true } },
  media: { orderBy: { position: 'asc' } },
} as const satisfies Prisma.PropertyInclude

export function toCrmProperty(row: CrmPropertyRow): CrmPropertyDetail {
  const address = row.address
  return {
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    propertyType: row.type,
    price: row.price.toNumber(),
    condoFee: row.condoFee?.toNumber() ?? null,
    propertyTax: row.propertyTax?.toNumber() ?? null,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parkingSpots: row.parkingSpots,
    area: row.areaSqm?.toNumber() ?? null,
    city: address?.city ?? null,
    neighborhood: address?.neighborhood ?? null,
    latitude: address?.latitude?.toNumber() ?? null,
    longitude: address?.longitude?.toNumber() ?? null,
    brokerName: row.responsible.name,
    brokerAvatarUrl: row.responsible.avatarUrl,
    coverUrl: row.media[0]?.url ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    description: row.description,
    address: address
      ? {
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          latitude: address.latitude?.toNumber() ?? null,
          longitude: address.longitude?.toNumber() ?? null,
        }
      : null,
    media: row.media.map((media) => ({
      id: media.id,
      url: media.url,
      type: media.type,
      order: media.position,
    })),
  }
}
