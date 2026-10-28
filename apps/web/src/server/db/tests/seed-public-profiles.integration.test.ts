import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { seedTenants } from '../../../../prisma/seed-data'
import { seedPublicProfiles } from '../../../../prisma/seed-public-profiles'
import { isolatedPrismaSchema } from './isolated-prisma-schema'

describe('demonstration public profile seed', () => {
  let fixture: Awaited<ReturnType<typeof isolatedPrismaSchema>>
  let database: PrismaClient

  beforeAll(async () => {
    fixture = await isolatedPrismaSchema([
      'tenants',
      'users',
      'broker_public_profiles',
      'agency_public_profiles',
      'agency_profile_highlights',
    ])
    database = fixture.database
  })

  beforeEach(async () => {
    await database.agencyProfileHighlight.deleteMany()
    await database.agencyPublicProfile.deleteMany()
    await database.brokerPublicProfile.deleteMany()
    await database.user.deleteMany()
    await database.tenant.deleteMany()
    for (const tenant of seedTenants) {
      await database.tenant.create({
        data: {
          name: tenant.name,
          slug: tenant.slug,
          accountType: tenant.accountType ?? 'AGENCY',
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          users: {
            create: tenant.members.map((member) => ({
              name: member.name,
              email: member.email,
              role: member.role,
              avatarUrl: member.avatarUrl,
              passwordHash: 'not-used',
            })),
          },
        },
      })
    }
  })

  afterAll(async () => {
    await fixture?.dispose()
  })

  it('creates eleven eligible brokers and three agencies with real demo-team links', async () => {
    expect(await seedPublicProfiles(database)).toEqual({ brokers: 11, agencies: 3 })
    expect(await database.brokerPublicProfile.count({ where: { status: 'PUBLISHED' } })).toBe(11)
    expect(await database.agencyPublicProfile.count({ where: { status: 'PUBLISHED' } })).toBe(3)
    const teams = await database.agencyProfileHighlight.findMany({
      include: { user: true, profile: true },
    })
    expect(teams).toHaveLength(10)
    for (const member of teams) {
      expect(member.user.tenantId).toBe(member.profile.tenantId)
      expect(['OWNER', 'AGENT']).toContain(member.user.role)
      expect(member.user.active).toBe(true)
      expect(member.user.membershipApprovedAt).not.toBeNull()
    }
  })

  it('preserves customized draft profiles and selected teams across repeated runs', async () => {
    await seedPublicProfiles(database)
    const camila = await database.user.findUniqueOrThrow({
      where: {
        tenantId_email: {
          tenantId: (await database.tenant.findUniqueOrThrow({ where: { slug: 'ketris-demo' } }))
            .id,
          email: 'camila@ketris.com.br',
        },
      },
    })
    await database.brokerPublicProfile.update({
      where: { userId: camila.id },
      data: {
        displayName: 'Custom broker',
        bio: 'Existing content',
        status: 'DRAFT',
        publishedAt: null,
      },
    })
    const agency = await database.agencyPublicProfile.update({
      where: { tenantId: camila.tenantId },
      data: {
        displayName: 'Custom agency',
        summary: 'Do not overwrite',
        status: 'DRAFT',
        publishedAt: null,
        highlights: { deleteMany: {}, create: { userId: camila.id, position: 7 } },
      },
    })
    const brokerBefore = await database.brokerPublicProfile.findUniqueOrThrow({
      where: { userId: camila.id },
    })
    const agencyBefore = await database.agencyPublicProfile.findUniqueOrThrow({
      where: { id: agency.id },
      include: { highlights: true },
    })

    await seedPublicProfiles(database)
    await seedPublicProfiles(database)

    expect(
      await database.brokerPublicProfile.findUniqueOrThrow({ where: { userId: camila.id } }),
    ).toEqual(brokerBefore)
    expect(
      await database.agencyPublicProfile.findUniqueOrThrow({
        where: { id: agency.id },
        include: { highlights: true },
      }),
    ).toEqual(agencyBefore)
    expect(await database.brokerPublicProfile.count()).toBe(11)
    expect(await database.agencyPublicProfile.count()).toBe(3)
    expect(await database.agencyProfileHighlight.count()).toBe(7)
  })

  it('does not create public profiles for inactive, unapproved, or non-demo users', async () => {
    await database.user.updateMany({
      where: { email: 'camila@ketris.com.br' },
      data: { active: false },
    })
    await database.user.updateMany({
      where: { email: 'laura@ketris.com.br' },
      data: { membershipApprovedAt: null },
    })
    const tenant = await database.tenant.findUniqueOrThrow({ where: { slug: 'ketris-demo' } })
    const outsider = await database.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Real account',
        email: 'non-demo@example.test',
        passwordHash: 'unused',
        role: 'AGENT',
      },
    })
    expect(await seedPublicProfiles(database)).toEqual({ brokers: 9, agencies: 3 })
    expect(await database.brokerPublicProfile.count()).toBe(9)
    expect(
      await database.brokerPublicProfile.findUnique({ where: { userId: outsider.id } }),
    ).toBeNull()
  })
  it('does not create public demo profiles in a suspended tenant', async () => {
    const tenant = await database.tenant.update({
      where: { slug: 'ketris-demo' },
      data: { status: 'SUSPENDED' },
    })
    await seedPublicProfiles(database)
    expect(
      await database.agencyPublicProfile.findUnique({ where: { tenantId: tenant.id } }),
    ).toBeNull()
    const users = await database.user.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
    })
    expect(
      await database.brokerPublicProfile.count({
        where: { userId: { in: users.map((user) => user.id) } },
      }),
    ).toBe(0)
  })
})
