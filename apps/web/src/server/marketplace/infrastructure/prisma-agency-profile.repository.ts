import { resolveMutationAuthor } from '@server/shared/persistence/mutation-author'
import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { buildCreciNumberSlug, buildPublicProfileSlug } from '@shared/utils/public-profile-slug'

import type { AgencyProfileRepository } from '../application/ports/agency-profile-repository.port'
import type { DirectoryPage, DirectoryQuery } from '../types/directory'
import { normalizedDirectoryTerm, normalizedSearchText } from './directory-search-sql'
import {
  publicBrokerEligibility,
  publicTenantEligibility,
  publishedAgencySql,
} from './public-profile-visibility'
import type {
  AgencyListingSummary,
  AgencyProfile,
  AgencyProfileDraft,
  AgencyTeamHighlight,
} from '../types/agency-profile'
import type { TenantWithProfileRow } from '../types/prisma-agency-profile-repository'

const tenantWithProfileInclude = {
  publicProfile: {
    include: {
      highlights: {
        orderBy: { position: 'asc' as const },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  },
}

const publishedTenantWithProfileInclude = {
  publicProfile: {
    include: {
      highlights: {
        ...tenantWithProfileInclude.publicProfile.include.highlights,
        where: { user: publicBrokerEligibility },
      },
    },
  },
}

async function buildStats(tenantId: string) {
  const [activeListings, brokersCount, dealsClosed] = await Promise.all([
    prisma.property.count({ where: { tenantId, status: 'PUBLISHED' } }),
    prisma.user.count({
      where: {
        tenantId,
        active: true,
        membershipApprovedAt: { not: null },
        role: { in: ['OWNER', 'AGENT'] },
      },
    }),
    prisma.contract.count({ where: { tenantId, status: 'ACTIVE' } }),
  ])

  return { activeListings, brokersCount, dealsClosed }
}

async function buildFeaturedListings(tenantId: string): Promise<AgencyListingSummary[]> {
  const properties = await prisma.property.findMany({
    where: { tenantId, status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 4,
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

function toTeam(profile: TenantWithProfileRow['publicProfile']): AgencyTeamHighlight[] {
  if (!profile) return []

  return profile.highlights.map((featured) => ({
    userId: featured.user.id,
    name: featured.user.name,
    avatarUrl: featured.user.avatarUrl,
    order: featured.position,
  }))
}

async function toAgencyProfile(tenant: TenantWithProfileRow): Promise<AgencyProfile> {
  const profile = tenant.publicProfile
  const [stats, featuredListings] = await Promise.all([
    buildStats(tenant.id),
    buildFeaturedListings(tenant.id),
  ])

  return {
    id: tenant.id,
    displayName: profile?.displayName ?? tenant.name,
    headline: profile?.headline ?? null,
    summary: profile?.summary ?? null,
    legalCreci: profile?.legalCreci ?? null,
    headquarters: profile?.headquarters ?? null,
    address: profile?.address ?? null,
    phone: profile?.phone ?? null,
    email: profile?.email ?? null,
    coverage: profile?.coverage ?? [],
    segments: profile?.segments ?? [],
    yearsInMarket: profile?.yearsInMarket ?? null,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    backgroundColor: profile?.backgroundColor ?? null,
    logoUrl: profile?.logoUrl ?? null,
    bannerUrl: profile?.bannerUrl ?? null,
    status: profile?.status ?? 'DRAFT',
    publishedAt: profile?.publishedAt ?? null,
    stats,
    team: toTeam(profile),
    featuredListings,
  }
}

export class PrismaAgencyProfileRepository implements AgencyProfileRepository {
  async findForEditor(tenantId: string, actorId: string): Promise<AgencyProfile | null> {
    const [tenant, owner] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, include: tenantWithProfileInclude }),
      prisma.user.findFirst({
        where: { id: actorId, tenantId, role: 'OWNER', active: true },
        select: { email: true, emailVerifiedAt: true, phone: true, avatarUrl: true },
      }),
    ])

    if (!tenant || !owner) return null

    const profile = await toAgencyProfile(tenant)

    return {
      ...profile,
      email: profile.email ?? (owner.emailVerifiedAt ? owner.email : null),
      phone: profile.phone ?? owner.phone,
      logoUrl: profile.logoUrl ?? owner.avatarUrl,
    }
  }

  async findByTenantId(tenantId: string): Promise<AgencyProfile | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: tenantWithProfileInclude,
    })

    if (!tenant || !tenant.publicProfile) return null

    return toAgencyProfile(tenant)
  }

  async findPublishedById(tenantId: string): Promise<AgencyProfile | null> {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, ...publicTenantEligibility, publicProfile: { status: 'PUBLISHED' } },
      include: publishedTenantWithProfileInclude,
    })

    if (!tenant) return null

    return toAgencyProfile(tenant)
  }

  async findPublishedBySlug(slug: string, creci: string): Promise<AgencyProfile | null> {
    const tenants = await prisma.tenant.findMany({
      where: { ...publicTenantEligibility, publicProfile: { status: 'PUBLISHED' } },
      include: publishedTenantWithProfileInclude,
    })

    const tenant = tenants.find((currentTenant) => {
      const displayName = currentTenant.publicProfile?.displayName ?? currentTenant.name
      const legalCreci = currentTenant.publicProfile?.legalCreci ?? null

      return (
        buildPublicProfileSlug(displayName) === slug && buildCreciNumberSlug(legalCreci) === creci
      )
    })

    if (!tenant) return null

    return toAgencyProfile(tenant)
  }

  async listPublished({
    q,
    page,
    pageSize,
  }: DirectoryQuery): Promise<DirectoryPage<AgencyProfile>> {
    const term = normalizedDirectoryTerm(q)
    const text = normalizedSearchText([
      Prisma.sql`p."displayName"`,
      Prisma.sql`p."legalCreci"`,
      Prisma.sql`p.headquarters`,
      Prisma.sql`array_to_string(p.coverage, ' ')`,
      Prisma.sql`array_to_string(p.segments, ' ')`,
    ])
    const where = term
      ? Prisma.sql`${publishedAgencySql} AND ${text} LIKE ${term}`
      : publishedAgencySql
    const [rows, counts] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT p."tenantId" AS id FROM agency_public_profiles p
        JOIN tenants t ON t.id = p."tenantId"
        WHERE ${where}
        ORDER BY p."publishedAt" DESC NULLS LAST, p.id
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total FROM agency_public_profiles p
        JOIN tenants t ON t.id = p."tenantId" WHERE ${where}`,
    ])
    const tenants = await prisma.tenant.findMany({
      where: {
        id: { in: rows.map((row) => row.id) },
        ...publicTenantEligibility,
        publicProfile: { status: 'PUBLISHED' },
      },
      include: publishedTenantWithProfileInclude,
    })
    const byId = new Map(tenants.map((tenant) => [tenant.id, tenant]))
    const items = await Promise.all(
      rows.flatMap((row) => {
        const tenant = byId.get(row.id)
        return tenant ? [toAgencyProfile(tenant)] : []
      }),
    )

    return { items, totalCount: Number(counts[0]?.total ?? 0), page, pageSize }
  }

  async save(
    tenantId: string,
    draft: AgencyProfileDraft,
    actorId?: string,
  ): Promise<AgencyProfile> {
    const validUserIds =
      draft.team.length > 0
        ? new Set(
            (
              await prisma.user.findMany({
                where: { tenantId, id: { in: draft.team.map((member) => member.userId) } },
                select: { id: true },
              })
            ).map((user) => user.id),
          )
        : new Set<string>()

    const data = {
      updatedById: await resolveMutationAuthor(prisma, tenantId, actorId),
      displayName: draft.displayName,
      headline: draft.headline,
      summary: draft.summary,
      legalCreci: draft.legalCreci,
      headquarters: draft.headquarters,
      address: draft.address,
      phone: draft.phone,
      email: draft.email,
      coverage: draft.coverage,
      segments: draft.segments,
      yearsInMarket: draft.yearsInMarket,
      backgroundColor: draft.backgroundColor,
      logoUrl: draft.logoUrl,
      bannerUrl: draft.bannerUrl,
    }

    await prisma.$transaction(async (transaction) => {
      const profile = await transaction.agencyPublicProfile.upsert({
        where: { tenantId },
        create: { tenantId, ...data },
        update: data,
        select: { id: true },
      })

      await transaction.agencyProfileHighlight.deleteMany({
        where: { profileId: profile.id },
      })

      const validTeam = draft.team.filter((member) => validUserIds.has(member.userId))

      if (validTeam.length > 0) {
        await transaction.agencyProfileHighlight.createMany({
          data: validTeam.map((member) => ({
            profileId: profile.id,
            userId: member.userId,
            position: member.order,
          })),
        })
      }
    })

    const saved = await this.findByTenantId(tenantId)

    if (!saved) {
      throw new Error('Falha ao salvar o perfil público da imobiliária.')
    }

    return saved
  }

  async setStatus(
    tenantId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
    actorId?: string,
  ): Promise<AgencyProfile | null> {
    const existing = await prisma.agencyPublicProfile.findUnique({
      where: { tenantId },
      select: { tenantId: true },
    })

    if (!existing) return null

    await prisma.agencyPublicProfile.update({
      where: { tenantId },
      data: {
        status,
        publishedAt: publishedAt,
        updatedById: await resolveMutationAuthor(prisma, tenantId, actorId),
      },
    })

    return this.findByTenantId(tenantId)
  }
}
