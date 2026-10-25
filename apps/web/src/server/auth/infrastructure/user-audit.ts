import type { Prisma } from '@prisma/client'
import type { UserAuditInput } from '../types/user-audit'

export function recordUserAudit(tx: Prisma.TransactionClient, input: UserAuditInput) {
  const actor = input.actor ?? { kind: 'SYSTEM' }
  return tx.userAuditEvent.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId,
      action: input.action,
      actorType: actor.kind,
      actorUserId:
        actor.kind === 'USER' ? actor.id : actor.kind === 'SELF_REGISTRATION' ? input.userId : null,
      actorPlatformAdminId: actor.kind === 'PLATFORM_ADMIN' ? actor.id : null,
      changedFields: input.changedFields ?? [],
    },
  })
}
