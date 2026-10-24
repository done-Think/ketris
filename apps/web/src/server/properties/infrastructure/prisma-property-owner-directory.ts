import { prisma } from '@server/db/prisma'

import type { PropertyOwnerDirectory } from '../application/ports/property-owner-directory.port'

export class PrismaPropertyOwnerDirectory implements PropertyOwnerDirectory {
  async findActiveOwner(tenantId: string, id: string) {
    const owner = await prisma.usuario.findFirst({
      where: { id, tenantId, ativo: true, papel: 'PROPERTY_OWNER' },
      select: { id: true, nome: true },
    })
    return owner ? { id: owner.id, name: owner.nome } : null
  }

  async listActiveOwners(tenantId: string, page: number, pageSize: number) {
    return prisma.$transaction(
      async (transaction) => {
        const where = { tenantId, ativo: true, papel: 'PROPERTY_OWNER' as const }
        const owners = await transaction.usuario.findMany({
          where,
          select: { id: true, nome: true },
          orderBy: [{ nome: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
        const total = await transaction.usuario.count({ where })
        return {
          owners: owners.map((owner) => ({ id: owner.id, name: owner.nome })),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }
}
