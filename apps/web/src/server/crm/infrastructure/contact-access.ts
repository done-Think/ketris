import type { Prisma } from '@prisma/client'
import type { CrmScope } from '../types/prisma'

export function contactAccess(scope: CrmScope): Prisma.ContactWhereInput {
  return {
    tenantId: scope.actorTenantId,
    ...(scope.actorRole === 'AGENT'
      ? {
          OR: [
            { createdById: scope.actorId ?? '' },
            {
              leads: {
                some: { tenantId: scope.actorTenantId, responsibleId: scope.actorId ?? '' },
              },
            },
            {
              opportunities: {
                some: { tenantId: scope.actorTenantId, responsibleId: scope.actorId ?? '' },
              },
            },
          ],
        }
      : {}),
  }
}
