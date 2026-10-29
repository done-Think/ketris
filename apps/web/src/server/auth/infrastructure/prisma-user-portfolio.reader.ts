import { prisma } from '@server/db/prisma'

import type { UserPortfolioReader } from '../application/ports/user-portfolio-reader.port'

export class PrismaUserPortfolioReader implements UserPortfolioReader {
  async hasPortfolio(tenantId: string, userId: string): Promise<boolean> {
    const [properties, leads, opportunities, events] = await Promise.all([
      prisma.property.count({ where: { tenantId, responsibleId: userId } }),
      prisma.lead.count({ where: { tenantId, responsibleId: userId } }),
      prisma.opportunity.count({ where: { tenantId, responsibleId: userId } }),
      prisma.agendaEvent.count({
        where: {
          tenantId,
          responsibleId: userId,
          start: { gte: new Date() },
          status: { not: 'CANCELLED' },
        },
      }),
    ])

    return properties + leads + opportunities + events > 0
  }
}
