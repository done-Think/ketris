import type { Prisma } from '@prisma/client'

import type { ResponsibleLookupPort } from '../application/ports/responsible-lookup.port'
import type { OpportunityResponsible } from '../types/opportunity-responsible'
import type { CrmDatabase } from '../types/prisma'

function activeStaffWhere(tenantId: string): Prisma.UserWhereInput {
  return {
    tenantId,
    active: true,
    role: { in: ['OWNER', 'AGENT'] },
    membershipApprovedAt: { not: null },
    OR: [{ teamInvitation: null }, { teamInvitation: { acceptedAt: { not: null } } }],
  }
}

export class PrismaResponsibleLookup implements ResponsibleLookupPort {
  constructor(private readonly db: CrmDatabase) {}

  async findActiveStaffName(tenantId: string, userId: string): Promise<string | null> {
    const user = await this.db.user.findFirst({
      where: { id: userId, ...activeStaffWhere(tenantId) },
      select: { name: true },
    })

    return user?.name ?? null
  }

  async listActiveStaff(tenantId: string): Promise<OpportunityResponsible[]> {
    const users = await this.db.user.findMany({
      where: activeStaffWhere(tenantId),
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, role: true },
    })

    return users.flatMap((user) =>
      user.role === 'OWNER' || user.role === 'AGENT'
        ? [{ id: user.id, name: user.name, role: user.role }]
        : [],
    )
  }
}
