import { Prisma } from '@prisma/client'
import type { PropertyAccessHistorySnapshot } from '../types/property-history'
import { recordPropertyFieldHistory } from './record-property-history'

export async function readPropertyAccessHistory(
  tx: Prisma.TransactionClient,
  tenantId: string,
  ids: string[],
): Promise<PropertyAccessHistorySnapshot[]> {
  if (!ids.length) return []
  await tx.$queryRaw(Prisma.sql`
    SELECT id FROM properties WHERE "tenantId" = ${tenantId} AND id IN (${Prisma.join(ids)})
    ORDER BY id FOR UPDATE
  `)
  const rows = await tx.property.findMany({
    where: { tenantId, id: { in: ids } },
    select: {
      id: true,
      responsible: { select: { id: true, name: true } },
      brokerAccess: {
        orderBy: { userId: 'asc' },
        select: { user: { select: { id: true, name: true } } },
      },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    responsible: row.responsible,
    brokers: row.brokerAccess.map((access) => access.user),
  }))
}

export async function recordPropertyAccessHistory(
  tx: Prisma.TransactionClient,
  tenantId: string,
  before: PropertyAccessHistorySnapshot[],
  actorId: string | null,
) {
  const after = await readPropertyAccessHistory(
    tx,
    tenantId,
    before.map((row) => row.id),
  )
  const currentById = new Map(after.map((row) => [row.id, row]))
  for (const previous of before) {
    const current = currentById.get(previous.id)
    if (!current) continue
    await recordPropertyFieldHistory(tx, {
      tenantId,
      propertyId: previous.id,
      actorId,
      action: 'UPDATED',
      changes: [
        { field: 'responsible', before: previous.responsible, after: current.responsible },
        { field: 'brokers', before: previous.brokers, after: current.brokers },
      ],
    })
  }
}
