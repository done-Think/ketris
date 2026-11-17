import type { Prisma } from '@prisma/client'

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
                some: {
                  tenantId,
                  userId: brokerId,
                  user: {
                    tenantId,
                    role: 'AGENT',
                    active: true,
                    membershipApprovedAt: { not: null },
                    OR: [
                      { teamInvitation: null },
                      { teamInvitation: { acceptedAt: { not: null } } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
  }
}
