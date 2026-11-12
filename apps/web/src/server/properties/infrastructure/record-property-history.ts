import type { Prisma } from '@prisma/client'
import { ForbiddenError } from '@server/shared/errors'
import { propertyHistoryChanges } from '../domain/property-history'
import { propertyHistoryChangeSchema } from '../schemas/property-history.schema'
import type {
  RecordPropertyHistoryInput,
  RecordPropertyFieldHistoryInput,
} from '../types/property-history'

export async function recordPropertyHistory(
  tx: Prisma.TransactionClient,
  input: RecordPropertyHistoryInput,
) {
  const changes = propertyHistoryChanges(input.before, input.after, input.previous, input.next)
  return recordPropertyFieldHistory(tx, {
    tenantId: input.after.tenantId,
    propertyId: input.after.id,
    actorId: input.actorId,
    action: input.action,
    changes,
  })
}

export async function recordPropertyFieldHistory(
  tx: Prisma.TransactionClient,
  input: RecordPropertyFieldHistoryInput,
) {
  const changes = input.changes
    .filter((change) => JSON.stringify(change.before) !== JSON.stringify(change.after))
    .map((change) => propertyHistoryChangeSchema.parse(change))
  if (!changes.length) return
  const actor = input.actorId
    ? await tx.user.findFirst({
        where: { id: input.actorId, tenantId: input.tenantId, active: true },
        select: { name: true, role: true },
      })
    : null
  if (input.actorId && !actor) throw new ForbiddenError()
  await tx.propertyAuditEvent.create({
    data: {
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      actorUserId: input.actorId,
      actorName: actor?.name ?? null,
      actorRole: actor?.role ?? null,
      action: input.action,
      createdAt: new Date(),
      changes: JSON.parse(JSON.stringify(changes)) as Prisma.InputJsonValue,
    },
  })
}
