import type { CrmDatabase, CrmScope } from '../types/prisma'

export async function recordCrmAudit(
  db: CrmDatabase,
  scope: CrmScope,
  entityType: string,
  entityId: string,
  action: string,
  changedFields: string[],
): Promise<void> {
  await db.crmAuditEvent.create({
    data: {
      tenantId: scope.actorTenantId,
      entityType,
      entityId,
      actorUserId: scope.actorId ?? null,
      actorRole: scope.actorRole,
      action: scope.actorId ? action : `SYSTEM_${action}`,
      changedFields,
    },
  })
}
