import type { Prisma } from '@prisma/client'
import { activePropertyBrokerWhere } from '@server/properties/infrastructure/property-broker-eligibility'

// Without brokerId the scope covers the whole tenant (managers). With brokerId it keeps the
// properties the broker is responsible for or was given access to.
export function crmPropertyAccessWhere(
  tenantId: string,
  brokerId?: string,
): Prisma.PropertyWhereInput {
  return {
    tenantId,
    ...(brokerId !== undefined
      ? {
          OR: [
            { responsibleId: brokerId },
            {
              brokerAccess: {
                some: { tenantId, userId: brokerId, user: activePropertyBrokerWhere(tenantId) },
              },
            },
          ],
        }
      : {}),
  }
}
