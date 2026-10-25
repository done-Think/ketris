import type { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { AgendaPropertyCatalog } from '../application/ports/agenda-property-catalog.port'
import type { AgendaReadActor } from '../types/read-actor'
import type { AgendaPropertyOptionsQuery } from '../types/property-catalog'
import type { AgendaPropertyRecord } from '../types/prisma-property'

const propertySelect = {
  id: true,
  titulo: true,
  endereco: { select: { bairro: true, cidade: true } },
} as const

export class PrismaAgendaPropertyCatalog implements AgendaPropertyCatalog {
  list(query: AgendaPropertyOptionsQuery) {
    const search = query.search?.trim()
    const where: Prisma.ImovelWhereInput = {
      ...agendaPropertyWhere(query),
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: 'insensitive' } },
              {
                endereco: {
                  is: {
                    OR: [
                      { bairro: { contains: search, mode: 'insensitive' } },
                      { cidade: { contains: search, mode: 'insensitive' } },
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
        const items = await tx.imovel.findMany({
          where,
          select: propertySelect,
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        })
        const total = await tx.imovel.count({ where })
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
    const records = await prisma.imovel.findMany({
      where: { ...agendaPropertyWhere(actor), id: { in: propertyIds } },
      select: propertySelect,
    })
    return records.map(toPropertyOption)
  }
}

export function agendaPropertyWhere(actor: AgendaReadActor): Prisma.ImovelWhereInput {
  if (actor.actorPapel === 'RENTER')
    return {
      contratos: {
        some: {
          status: 'ATIVO',
          partes: { some: { papel: 'LOCATARIO', usuarioId: actor.actorUserId } },
        },
      },
    }
  return {
    tenantId: actor.actorTenantId,
    ...(actor.actorPapel === 'AGENT' ? { responsavelId: actor.actorUserId } : {}),
    ...(actor.actorPapel === 'PROPERTY_OWNER' ? { proprietarioId: actor.actorUserId } : {}),
  }
}

function toPropertyOption(record: AgendaPropertyRecord) {
  return {
    id: record.id,
    label: record.endereco
      ? `${record.titulo} - ${record.endereco.bairro}, ${record.endereco.cidade}`
      : record.titulo,
  }
}
