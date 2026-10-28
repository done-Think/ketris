import type { Prisma } from '@prisma/client'
import type { AgendaAuditInput } from '../types/audit'

export async function recordAgendaAudit(
  transaction: Prisma.TransactionClient,
  input: AgendaAuditInput,
) {
  const event = await transaction.agendaEventAudit.create({
    data: {
      tenantId: input.tenantId,
      eventId: input.eventId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      changedFields: input.changedFields ?? [],
      cancellationReason: input.cancellationReason ?? null,
    },
  })
  const authorId = input.actorUserId ?? null
  await transaction.$executeRaw`UPDATE agenda_events SET "updatedById" = ${authorId} WHERE id = ${input.eventId} AND "tenantId" = ${input.tenantId}`
  return event
}
