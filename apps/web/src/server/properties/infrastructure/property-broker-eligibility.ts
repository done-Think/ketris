import type { Prisma } from '@prisma/client'

export function activePropertyBrokerWhere(tenantId?: string): Prisma.UserWhereInput {
  return {
    tenantId,
    role: 'AGENT',
    active: true,
    membershipApprovedAt: { not: null },
    OR: [{ teamInvitation: null }, { teamInvitation: { acceptedAt: { not: null } } }],
  }
}
