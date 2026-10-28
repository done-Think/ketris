import type { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { AgendaPropertyCatalog } from '../application/ports/agenda-property-catalog.port'
import type { AgendaReadActor } from '../types/read-actor'
import type { AgendaPropertyOptionsQuery } from '../types/property-catalog'
import type { AgendaPropertyRecord } from '../types/prisma-property'

const propertySelect = {
  id: true,
  title: true,
  address: { select: { neighborhood: true, city: true } },
} as const

export class PrismaAgendaPropertyCatalog implements AgendaPropertyCatalog {
  list(query: AgendaPropertyOptionsQuery) {
    const search = query.search?.trim()
    const where: Prisma.PropertyWhereInput = {
      ...agendaPropertyWhere(query),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              {
                address: {
                  is: {
                    OR: [
                      { neighborhood: { contains: search, mode: 'insensitive' } },
                      { city: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    }
    return prisma.$transaction(
      async (tx) => {
        const items = await tx.property.findMany({
          where,
          select: propertySelect,
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        })
        const total = await tx.property.count({ where })
        return {
          items: items.map(toPropertyOption),
          total,
          page: query.page,
          pageSize: query.pageSize,
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }

  async summaries(actor: AgendaReadActor, propertyIds: string[]) {
    if (!propertyIds.length) return []
    const records = await prisma.property.findMany({
      where: { ...agendaPropertyWhere(actor), id: { in: propertyIds } },
      select: propertySelect,
    })
    return records.map(toPropertyOption)
  }
}

export function agendaPropertyWhere(actor: AgendaReadActor): Prisma.PropertyWhereInput {
  if (actor.actorRole === 'RENTER')
    return {
      contracts: {
        some: {
          status: 'ACTIVE',
          parties: { some: { role: 'RENTER', userId: actor.actorUserId } },
        },
      },
    }
  return {
    tenantId: actor.actorTenantId,
    ...(actor.actorRole === 'AGENT' ? { responsibleId: actor.actorUserId } : {}),
    ...(actor.actorRole === 'PROPERTY_OWNER' ? { ownerId: actor.actorUserId } : {}),
  }
}

function toPropertyOption(record: AgendaPropertyRecord) {
  return {
    id: record.id,
    label: record.address
      ? `${record.title} - ${record.address.neighborhood}, ${record.address.city}`
      : record.title,
  }
}
