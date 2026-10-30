import { prisma } from '@server/db/prisma'
import { publishedBrokerEligibility } from './public-profile-visibility'

import type { MarketplaceStatsReader } from '../application/ports/marketplace-stats-reader.port'
import type { MarketplaceStats, MarketplaceLocationRow } from '../types/marketplace-stats'

export class PrismaMarketplaceStatsReader implements MarketplaceStatsReader {
  async read(): Promise<MarketplaceStats> {
    const [publishedProperties, publishedBrokers, cities, places] = await Promise.all([
      prisma.property.count({ where: { status: 'PUBLISHED' } }),
      prisma.brokerPublicProfile.count({ where: publishedBrokerEligibility }),
      prisma.propertyAddress.groupBy({
        by: ['city', 'state'],
        where: { property: { status: 'PUBLISHED' } },
      }),
      prisma.$queryRaw<MarketplaceLocationRow[]>`
        SELECT concat_ws(', ', NULLIF(btrim(a."neighborhood"), ''), btrim(a."city")) AS "location"
        FROM "property_addresses" a
        JOIN "properties" p ON p."id" = a."propertyId" AND p."tenantId" = a."tenantId"
        WHERE p."status" = 'PUBLISHED' AND btrim(a."city") <> ''
        GROUP BY "location"
        ORDER BY count(*) DESC, "location" ASC
        LIMIT 20
      `,
    ])

    const locations = places.map(({ location }) => location)
    return { publishedProperties, publishedBrokers, servedCities: cities.length, locations }
  }
}
