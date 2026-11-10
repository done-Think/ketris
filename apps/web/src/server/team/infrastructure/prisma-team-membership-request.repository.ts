import { prisma } from '@server/db/prisma'

import type { TeamMembershipRequestRepository } from '../application/ports/team-membership-request-repository.port'
import { userHasPortfolio } from './user-portfolio'

const pendingRequest = (tenantId: string, userId: string) => ({
  tenantId,
  id: userId,
  membershipApprovedAt: null,
})

export class PrismaTeamMembershipRequestRepository implements TeamMembershipRequestRepository {
  async isPending(tenantId: string, userId: string): Promise<boolean> {
    return (await prisma.user.count({ where: pendingRequest(tenantId, userId) })) > 0
  }

  hasPortfolio(tenantId: string, userId: string): Promise<boolean> {
    return userHasPortfolio(tenantId, userId)
  }

  async deletePending(tenantId: string, userId: string): Promise<boolean> {
    const { count } = await prisma.user.deleteMany({ where: pendingRequest(tenantId, userId) })

    return count > 0
  }
}
