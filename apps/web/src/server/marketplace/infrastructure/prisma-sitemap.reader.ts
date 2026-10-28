import { prisma } from '@server/db/prisma'

import type { PublicSitemapRecord, SitemapKind } from '../types/sitemap'
import { sitemapPageSize } from '../types/sitemap'
import { publicTenantEligibility, publishedBrokerEligibility } from './public-profile-visibility'

const agencyEligibility = { status: 'PUBLISHED', tenant: publicTenantEligibility } as const

export async function countPublicSitemapRecords(): Promise<Record<SitemapKind, number>> {
  const [properties, brokers, agencies] = await Promise.all([
    prisma.property.count({ where: { status: 'PUBLISHED' } }),
    prisma.brokerPublicProfile.count({ where: publishedBrokerEligibility }),
    prisma.agencyPublicProfile.count({ where: agencyEligibility }),
  ])
  return { properties, brokers, agencies }
}

export async function listPublicSitemapRecords(
  kind: SitemapKind,
  page: number,
): Promise<PublicSitemapRecord[]> {
  if (!Number.isSafeInteger(page) || page < 0 || page > Math.floor(2147483647 / sitemapPageSize)) {
    throw new RangeError('Invalid sitemap page.')
  }
  const pagination = { take: sitemapPageSize, skip: page * sitemapPageSize }
  if (kind === 'properties') {
    return prisma.property.findMany({
      where: { status: 'PUBLISHED' },
      ...pagination,
      orderBy: { id: 'asc' },
      select: { id: true, updatedAt: true },
    })
  }
  if (kind === 'brokers') {
    const profiles = await prisma.brokerPublicProfile.findMany({
      where: publishedBrokerEligibility,
      ...pagination,
      orderBy: { id: 'asc' },
      select: { userId: true, updatedAt: true },
    })
    return profiles.map(({ userId, updatedAt }) => ({ id: userId, updatedAt }))
  }
  const profiles = await prisma.agencyPublicProfile.findMany({
    where: agencyEligibility,
    ...pagination,
    orderBy: { id: 'asc' },
    select: { tenantId: true, displayName: true, legalCreci: true, updatedAt: true },
  })
  return profiles.map(({ tenantId, ...profile }) => ({ id: tenantId, ...profile }))
}
