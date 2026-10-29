import { prisma } from '@server/db/prisma'
import { publishedBrokerEligibility } from './public-profile-visibility'

import type { MarketplaceStatsReader } from '../application/ports/marketplace-stats-reader.port'
import type { MarketplaceStats } from '../types/marketplace-stats'

export class PrismaMarketplaceStatsReader implements MarketplaceStatsReader {
  async read(): Promise<MarketplaceStats> {
    const [publishedProperties, publishedBrokers, cities, places] = await Promise.all([
      prisma.property.count({ where: { status: 'PUBLISHED' } }),
      prisma.brokerPublicProfile.count({ where: publishedBrokerEligibility }),
      prisma.propertyAddress.groupBy({
        by: ['city', 'state'],
        where: { property: { status: 'PUBLISHED' } },
      }),
      prisma.propertyAddress.groupBy({
        by: ['city', 'state', 'neighborhood'],
        where: { property: { status: 'PUBLISHED' }, city: { not: '' } },
        orderBy: [{ city: 'asc' }, { neighborhood: 'asc' }, { state: 'asc' }],
        take: 20,
      }),
    ])

    const locations = [
      ...new Set(
        places
          .filter(({ city }) => city.trim())
          .map(({ neighborhood, city }) =>
            [neighborhood.trim(), city.trim()].filter(Boolean).join(', '),
          ),
      ),
    ]
    return { publishedProperties, publishedBrokers, servedCities: cities.length, locations }
  }
}
