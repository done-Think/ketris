import { prisma } from '@server/db/prisma'

import type { PropertyOwnerDirectory } from '../application/ports/property-owner-directory.port'

export class PrismaPropertyOwnerDirectory implements PropertyOwnerDirectory {
  async findActiveOwner(tenantId: string, id: string) {
    const owner = await prisma.user.findFirst({
      where: { id, tenantId, active: true, role: 'PROPERTY_OWNER' },
      select: { id: true, name: true },
    })
    return owner ? { id: owner.id, name: owner.name } : null
  }

  async listActiveOwners(tenantId: string, page: number, pageSize: number) {
    return prisma.$transaction(
      async (transaction) => {
        const where = { tenantId, active: true, role: 'PROPERTY_OWNER' as const }
        const owners = await transaction.user.findMany({
          where,
          select: { id: true, name: true },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
        const total = await transaction.user.count({ where })
        return {
          owners: owners.map((owner) => ({ id: owner.id, name: owner.name })),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }
}
