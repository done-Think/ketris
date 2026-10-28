import { prisma } from '@server/db/prisma'
import { publishedBrokerEligibility } from './public-profile-visibility'

import type { MarketplaceStatsReader } from '../application/ports/marketplace-stats-reader.port'
import type { MarketplaceStats } from '../types/marketplace-stats'

export class PrismaMarketplaceStatsReader implements MarketplaceStatsReader {
  async read(): Promise<MarketplaceStats> {
    const [publishedProperties, publishedBrokers, cities] = await Promise.all([
      prisma.property.count({ where: { status: 'PUBLISHED' } }),
      prisma.brokerPublicProfile.count({ where: publishedBrokerEligibility }),
      prisma.propertyAddress.groupBy({
        by: ['city', 'state'],
        where: { property: { status: 'PUBLISHED' } },
      }),
    ])

    return { publishedProperties, publishedBrokers, servedCities: cities.length }
  }
}
