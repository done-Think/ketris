import type { Prisma } from '@prisma/client'
import type { AgendaAuditInput } from '../types/audit'

export function recordAgendaAudit(transaction: Prisma.TransactionClient, input: AgendaAuditInput) {
  return transaction.agendaEventAudit.create({
    data: {
      tenantId: input.tenantId,
      eventId: input.eventId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      changedFields: input.changedFields ?? [],
      cancellationReason: input.cancellationReason ?? null,
    },
  })
}
