import type { Prisma } from '@prisma/client'
import type { MaintenanceActor } from '../types/maintenance-ticket'

export async function recordMaintenanceProviderAudit(
  db: Prisma.TransactionClient,
  actor: MaintenanceActor,
  providerId: string,
  tenantId: string,
  action: string,
  changedFields: string[],
) {
  await db.atividadePrestadorManutencao.create({
    data: {
      tenantId,
      prestadorId: providerId,
      actorUserId: actor.actorId,
      actorRole: actor.actorPapel,
      action,
      changedFields,
    },
  })
}
