import { prisma } from '@server/db/prisma'

import type { FavoritePropertyRepository } from '../application/ports/favorite-property-repository.port'
import type {
  FavoritePropertyEntry,
  FavoritePropertyKey,
  FavoritePropertyOwner,
  SavedFavoriteProperty,
} from '../types/favorite-property'
import {
  publicPropertySummarySelect,
  toPublishedPropertySummary,
} from './prisma-public-property.repository'

function toSaved(row: { propertyId: string; createdAt: Date }): SavedFavoriteProperty {
  return { propertyId: row.propertyId, savedAt: row.createdAt }
}

export class PrismaFavoritePropertyRepository implements FavoritePropertyRepository {
  async list(owner: FavoritePropertyOwner, limit: number): Promise<FavoritePropertyEntry[]> {
    const rows = await prisma.favoriteProperty.findMany({
      where: owner,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit,
      select: {
        propertyId: true,
        createdAt: true,
        property: { select: { ...publicPropertySummarySelect, status: true } },
      },
    })

    return rows.map(({ property, ...row }) =>
      property.status === 'PUBLISHED'
        ? { ...toSaved(row), available: true, property: toPublishedPropertySummary(property) }
        : {
            ...toSaved(row),
            available: false,
            property: {
              title: property.title,
              city: property.address?.city ?? null,
              neighborhood: property.address?.neighborhood ?? null,
            },
          },
    )
  }

  async find(key: FavoritePropertyKey): Promise<SavedFavoriteProperty | null> {
    const row = await prisma.favoriteProperty.findFirst({
      where: key,
      select: { propertyId: true, createdAt: true },
    })
    return row ? toSaved(row) : null
  }

  count(owner: FavoritePropertyOwner): Promise<number> {
    return prisma.favoriteProperty.count({ where: owner })
  }

  async save(key: FavoritePropertyKey): Promise<SavedFavoriteProperty> {
    const row = await prisma.favoriteProperty.upsert({
      where: { userId_propertyId: { userId: key.userId, propertyId: key.propertyId } },
      create: key,
      update: {},
      select: { propertyId: true, createdAt: true },
    })
    return toSaved(row)
  }

  async remove(key: FavoritePropertyKey): Promise<void> {
    await prisma.favoriteProperty.deleteMany({ where: key })
  }
}
