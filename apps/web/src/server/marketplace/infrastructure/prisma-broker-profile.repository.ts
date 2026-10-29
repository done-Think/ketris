import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { BrokerProfileRepository } from '../application/ports/broker-profile-repository.port'
import type { DirectoryPage, DirectoryQuery } from '../types/directory'
import { normalizedDirectoryTerm, normalizedSearchText } from './directory-search-sql'
import { publicBrokerEligibility, publishedBrokerSql } from './public-profile-visibility'
import type {
  BrokerListingSummary,
  BrokerProfile,
  BrokerProfileDraft,
} from '../types/broker-profile'
import type { UserWithProfileRow } from '../types/prisma-broker-profile-repository'

const userWithProfileInclude = {
  tenant: { select: { name: true } },
  publicProfile: true,
} as const

async function buildStats(userId: string) {
  const [activeListings, dealsClosed] = await Promise.all([
    prisma.property.count({ where: { responsibleId: userId, status: 'PUBLISHED' } }),
    prisma.contract.count({ where: { status: 'ACTIVE', property: { responsibleId: userId } } }),
  ])

  return { activeListings, dealsClosed }
}

async function buildRecentListings(userId: string): Promise<BrokerListingSummary[]> {
  const properties = await prisma.property.findMany({
    where: { responsibleId: userId, status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      title: true,
      purpose: true,
      price: true,
      address: { select: { neighborhood: true, city: true } },
      media: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
    },
  })

  return properties.map((property) => ({
    id: property.id,
    title: property.title,
    purpose: property.purpose,
    price: property.price.toNumber(),
    neighborhood: property.address?.neighborhood ?? null,
    city: property.address?.city ?? null,
    coverUrl: property.media[0]?.url ?? null,
  }))
}

async function toBrokerProfile(user: UserWithProfileRow): Promise<BrokerProfile> {
  const profile = user.publicProfile
  const [stats, recentListings] = await Promise.all([
    buildStats(user.id),
    buildRecentListings(user.id),
  ])

  return {
    id: user.id,
    tenantId: user.tenantId,
    agencyName: user.tenant.name,
    email: user.email,
    displayName: profile?.displayName ?? user.name,
    headline: profile?.headline ?? null,
    bio: profile?.bio ?? null,
    creci: profile?.creci ?? null,
    phone: profile?.phone ?? null,
    region: profile?.region ?? null,
    neighborhoods: profile?.neighborhoods ?? [],
    specialties: profile?.specialties ?? [],
    availability: profile?.availability ?? null,
    primaryColor: profile?.primaryColor ?? null,
    secondaryColor: profile?.secondaryColor ?? null,
    backgroundColor: profile?.backgroundColor ?? null,
    avatarUrl: profile?.avatarUrl ?? user.avatarUrl,
    bannerUrl: profile?.bannerUrl ?? null,
    status: profile?.status ?? 'DRAFT',
    publishedAt: profile?.publishedAt ?? null,
    stats,
    recentListings,
  }
}

export class PrismaBrokerProfileRepository implements BrokerProfileRepository {
  async findByUserId(userId: string): Promise<BrokerProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: userWithProfileInclude,
    })

    if (!user || !user.publicProfile) return null

    return toBrokerProfile(user)
  }

  async findPublishedById(userId: string): Promise<BrokerProfile | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, ...publicBrokerEligibility, publicProfile: { status: 'PUBLISHED' } },
      include: userWithProfileInclude,
    })

    if (!user) return null

    return toBrokerProfile(user)
  }

  async listPublished({
    q,
    page,
    pageSize,
  }: DirectoryQuery): Promise<DirectoryPage<BrokerProfile>> {
    const term = normalizedDirectoryTerm(q)
    const text = normalizedSearchText([
      Prisma.sql`p."displayName"`,
      Prisma.sql`p.creci`,
      Prisma.sql`p.region`,
      Prisma.sql`array_to_string(p.neighborhoods, ' ')`,
      Prisma.sql`array_to_string(p.specialties, ' ')`,
    ])
    const where = term
      ? Prisma.sql`${publishedBrokerSql} AND ${text} LIKE ${term}`
      : publishedBrokerSql
    const [rows, counts] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT p."userId" AS id FROM broker_public_profiles p
        JOIN users u ON u.id = p."userId" JOIN tenants t ON t.id = u."tenantId"
        WHERE ${where}
        ORDER BY p."publishedAt" DESC NULLS LAST, p.id
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total FROM broker_public_profiles p
        JOIN users u ON u.id = p."userId" JOIN tenants t ON t.id = u."tenantId" WHERE ${where}`,
    ])
    const users = await prisma.user.findMany({
      where: {
        id: { in: rows.map((row) => row.id) },
        ...publicBrokerEligibility,
        publicProfile: { status: 'PUBLISHED' },
      },
      include: userWithProfileInclude,
    })
    const byId = new Map(users.map((user) => [user.id, user]))
    const items = await Promise.all(
      rows.flatMap((row) => {
        const user = byId.get(row.id)
        return user ? [toBrokerProfile(user)] : []
      }),
    )

    return { items, totalCount: Number(counts[0]?.total ?? 0), page, pageSize }
  }

  async save(userId: string, draft: BrokerProfileDraft): Promise<BrokerProfile> {
    const data = {
      updatedById: userId,
      displayName: draft.displayName,
      headline: draft.headline,
      bio: draft.bio,
      creci: draft.creci,
      phone: draft.phone,
      region: draft.region,
      neighborhoods: draft.neighborhoods,
      specialties: draft.specialties,
      availability: draft.availability,
      primaryColor: draft.primaryColor,
      secondaryColor: draft.secondaryColor,
      backgroundColor: draft.backgroundColor,
      avatarUrl: draft.avatarUrl,
      bannerUrl: draft.bannerUrl,
    }

    await prisma.brokerPublicProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    })

    const saved = await this.findByUserId(userId)

    if (!saved) {
      throw new Error('Falha ao salvar o perfil público de corretor.')
    }

    return saved
  }

  async setStatus(
    userId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<BrokerProfile | null> {
    const existing = await prisma.brokerPublicProfile.findUnique({
      where: { userId },
      select: { userId: true },
    })

    if (!existing) return null

    await prisma.brokerPublicProfile.update({
      where: { userId },
      data: { status, publishedAt: publishedAt, updatedById: userId },
    })

    return this.findByUserId(userId)
  }
}
