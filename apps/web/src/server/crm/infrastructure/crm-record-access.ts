import type { CrmScope } from '../types/prisma'

export function crmRecordAccess(scope: CrmScope) {
  return scope.actorRole === 'AGENT'
    ? {
        OR: [
          { responsibleId: scope.actorId ?? '' },
          {
            brokerAccess: { some: { tenantId: scope.actorTenantId, userId: scope.actorId ?? '' } },
          },
        ],
      }
    : {}
}
