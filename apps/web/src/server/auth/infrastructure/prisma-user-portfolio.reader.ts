import { prisma } from '@server/db/prisma'

import type { UserPortfolioReader } from '../application/ports/user-portfolio-reader.port'

export class PrismaUserPortfolioReader implements UserPortfolioReader {
  async hasPortfolio(tenantId: string, userId: string): Promise<boolean> {
    const [properties, leads, events] = await Promise.all([
      prisma.imovel.count({ where: { tenantId, responsavelId: userId } }),
      prisma.lead.count({ where: { tenantId, responsavelId: userId } }),
      prisma.eventoAgenda.count({
        where: {
          tenantId,
          responsavelId: userId,
          inicio: { gte: new Date() },
          status: { not: 'CANCELLED' },
        },
      }),
    ])

    return properties + leads + events > 0
  }
}
