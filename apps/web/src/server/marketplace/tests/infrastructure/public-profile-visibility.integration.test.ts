import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { buildCreciNumberSlug, buildPublicProfileSlug } from '@shared/utils/public-profile-slug'

import { PrismaAgencyProfileRepository } from '../../infrastructure/prisma-agency-profile.repository'
import { PrismaBrokerProfileRepository } from '../../infrastructure/prisma-broker-profile.repository'

describe('public profile eligibility', () => {
  const token = `visibility-${randomUUID()}`
  const agencyName = `Agency ${token}`
  const legalCreci = 'CRECI J-12345'
  const brokers = new PrismaBrokerProfileRepository()
  const agencies = new PrismaAgencyProfileRepository()
  let tenantId: string
  let userId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { name: agencyName, slug: token } })
    tenantId = tenant.id
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: token,
        email: `${token}@example.test`,
        passwordHash: 'unused',
        role: 'AGENT',
      },
    })
    userId = user.id
    await prisma.brokerPublicProfile.create({
      data: { userId, displayName: token, status: 'PUBLISHED' },
    })
    await prisma.agencyPublicProfile.create({
      data: {
        tenantId,
        displayName: agencyName,
        legalCreci,
        status: 'PUBLISHED',
        highlights: { create: { userId, position: 0 } },
      },
    })
  })

  afterEach(async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { active: true, role: 'AGENT', membershipApprovedAt: new Date() },
    })
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'ACTIVE' } })
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it.each([{ active: false }, { membershipApprovedAt: null }, { role: 'RENTER' as const }])(
    'hides ineligible brokers from directory/detail/team while preserving publication: %j',
    async (changes) => {
      await prisma.user.update({ where: { id: userId }, data: changes })
      expect(await brokers.findPublishedById(userId)).toBeNull()
      expect((await brokers.listPublished({ q: token, page: 1, pageSize: 10 })).totalCount).toBe(0)
      expect((await agencies.findPublishedById(tenantId))?.team).toEqual([])
      expect((await agencies.findByTenantId(tenantId))?.team).toHaveLength(1)
      expect((await brokers.findByUserId(userId))?.status).toBe('PUBLISHED')
      await prisma.user.update({
        where: { id: userId },
        data: { active: true, role: 'AGENT', membershipApprovedAt: new Date() },
      })
      expect((await brokers.findPublishedById(userId))?.status).toBe('PUBLISHED')
    },
  )

  it.each(['SUSPENDED', 'CANCELED'] as const)(
    'hides broker and agency profiles for a %s tenant and restores visibility upon reactivation',
    async (status) => {
      await prisma.tenant.update({ where: { id: tenantId }, data: { status } })
      expect(await brokers.findPublishedById(userId)).toBeNull()
      expect(await agencies.findPublishedById(tenantId)).toBeNull()
      expect(
        await agencies.findPublishedBySlug(
          buildPublicProfileSlug(agencyName),
          buildCreciNumberSlug(legalCreci),
        ),
      ).toBeNull()
      expect((await brokers.listPublished({ q: token, page: 1, pageSize: 10 })).totalCount).toBe(0)
      expect((await agencies.listPublished({ q: token, page: 1, pageSize: 10 })).totalCount).toBe(0)
      expect((await agencies.findByTenantId(tenantId))?.status).toBe('PUBLISHED')
      await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'TRIAL' } })
      expect((await brokers.findPublishedById(userId))?.status).toBe('PUBLISHED')
      expect((await agencies.findPublishedById(tenantId))?.status).toBe('PUBLISHED')
    },
  )
})
