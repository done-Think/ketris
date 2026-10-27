import { prisma } from '@server/db/prisma'

import type { MarketplaceStatsReader } from '../application/ports/marketplace-stats-reader.port'
import type { MarketplaceStats } from '../types/marketplace-stats'

export class PrismaMarketplaceStatsReader implements MarketplaceStatsReader {
  async read(): Promise<MarketplaceStats> {
    const [publishedProperties, publishedBrokers, cities] = await Promise.all([
      prisma.imovel.count({ where: { status: 'PUBLISHED' } }),
      prisma.perfilPublicoCorretor.count({ where: { status: 'PUBLISHED' } }),
      prisma.endereco.groupBy({
        by: ['cidade', 'estado'],
        where: { imovel: { status: 'PUBLISHED' } },
      }),
    ])

    return { publishedProperties, publishedBrokers, servedCities: cities.length }
  }
}
