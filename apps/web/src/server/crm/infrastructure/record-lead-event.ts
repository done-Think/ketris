import { randomUUID } from 'node:crypto'
import type { CrmInteractionKind, LeadStage } from '@prisma/client'
import type { CrmDatabase, CrmScope } from '../types/prisma'

export async function recordLeadEvent(
  db: CrmDatabase,
  scope: CrmScope,
  leadId: string,
  kind: Exclude<CrmInteractionKind, 'CONTACT_ATTEMPT'>,
  stages?: { previousStage: LeadStage; nextStage: LeadStage },
) {
  const actor = await db.user.findFirstOrThrow({
    where: { id: scope.actorId ?? '', tenantId: scope.actorTenantId, active: true },
    select: { name: true },
  })
  await db.crmInteraction.create({
    data: {
      tenantId: scope.actorTenantId,
      leadId,
      kind,
      requestId: randomUUID(),
      actorUserId: scope.actorId ?? '',
      actorName: actor.name,
      status: null,
      ...stages,
    },
  })
}
