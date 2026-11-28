import type { PropertyAuditEvent } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { PropertyHistoryRepository } from '../application/ports/property-history-repository.port'
import { propertyHistoryEventSchema } from '../schemas/property-history.schema'

function mapEvent(row: PropertyAuditEvent) {
  const event = propertyHistoryEventSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
    fields: [],
  })
  return { ...event, fields: event.changes.map((change) => change.field) }
}

export class PrismaPropertyHistoryRepository implements PropertyHistoryRepository {
  list(tenantId: string, propertyId: string, page: number, pageSize: number) {
    return prisma.$transaction(
      async (tx) => {
        const where = { tenantId, propertyId }
        const rows = await tx.propertyAuditEvent.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
        const total = await tx.propertyAuditEvent.count({ where })
        return {
          events: rows.map((row) => {
            const { changes, ...summary } = mapEvent(row)
            return { ...summary, fields: changes.map((change) => change.field) }
          }),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }
  async find(tenantId: string, propertyId: string, eventId: string) {
    const row = await prisma.propertyAuditEvent.findFirst({
      where: { tenantId, propertyId, id: eventId },
    })
    return row ? mapEvent(row) : null
  }
}
