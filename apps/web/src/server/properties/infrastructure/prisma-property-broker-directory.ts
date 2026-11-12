import { prisma } from '@server/db/prisma'
import type { PropertyBrokerDirectory } from '../application/ports/property-broker-directory.port'
import { activePropertyBrokerWhere } from './property-broker-eligibility'

export class PrismaPropertyBrokerDirectory implements PropertyBrokerDirectory {
  countActiveBrokers(tenantId: string, ids: string[]) {
    return prisma.user.count({ where: { ...activePropertyBrokerWhere(tenantId), id: { in: ids } } })
  }

  listActiveBrokers(tenantId: string, page: number, pageSize: number) {
    return prisma.$transaction(
      async (tx) => {
        const where = activePropertyBrokerWhere(tenantId)
        const brokers = await tx.user.findMany({
          where,
          select: { id: true, name: true },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
        const total = await tx.user.count({ where })
        return {
          brokers,
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }
}
