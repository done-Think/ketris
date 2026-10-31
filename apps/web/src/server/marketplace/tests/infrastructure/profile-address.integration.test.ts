import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { GET, PUT } from '@/app/api/marketplace/profiles/[kind]/address/route'
import { GET as AVAILABILITY } from '@/app/api/marketplace/profiles/[kind]/address/availability/route'
import { prisma } from '@server/db/prisma'
import { authContainer } from '@server/auth/container'
import { PrismaProfileAddressRepository } from '../../infrastructure/prisma-profile-address.repository'
import { PublicProfileAddressTakenError } from '../../domain/profile-address-errors'
import { listPublicSitemapRecords } from '../../infrastructure/prisma-sitemap.reader'
import { marketplaceContainer } from '../../container'
import { getRecordHref } from '@/i18n/sitemaps'

describe('public profile addresses', () => {
  const suffix = randomUUID().slice(0, 8)
  const repo = new PrismaProfileAddressRepository()
  let tenantId: string
  let otherTenantId: string
  let ownerId: string
  let brokerId: string
  let otherBrokerId: string
  let ownerToken: string
  let brokerToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Address Agency', slug: `addresses-${suffix}`, status: 'ACTIVE' },
    })
    const other = await prisma.tenant.create({
      data: { name: 'Other Agency', slug: `other-addresses-${suffix}`, status: 'ACTIVE' },
    })
    tenantId = tenant.id
    otherTenantId = other.id
    const owner = await prisma.user.create({
      data: {
        tenantId,
        name: 'Owner',
        email: `owner-${suffix}@example.test`,
        passwordHash: 'unused',
        role: 'OWNER',
        membershipApprovedAt: new Date(),
        emailVerifiedAt: new Date(),
      },
    })
    const broker = await prisma.user.create({
      data: {
        tenantId,
        name: 'Broker',
        email: `broker-${suffix}@example.test`,
        passwordHash: 'unused',
        role: 'AGENT',
        membershipApprovedAt: new Date(),
        emailVerifiedAt: new Date(),
      },
    })
    const otherBroker = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        name: 'Other Broker',
        email: `other-broker-${suffix}@example.test`,
        passwordHash: 'unused',
        role: 'AGENT',
        membershipApprovedAt: new Date(),
        emailVerifiedAt: new Date(),
      },
    })
    ownerId = owner.id
    brokerId = broker.id
    otherBrokerId = otherBroker.id
    ownerToken = await authContainer.tokenService.sign(owner)
    brokerToken = await authContainer.tokenService.sign(broker)
    await prisma.brokerPublicProfile.create({
      data: { userId: brokerId, displayName: 'Public Address Broker', status: 'DRAFT' },
    })
  })
  beforeEach(async () => {
    await prisma.publicProfileAddress.deleteMany({
      where: {
        OR: [
          { agencyTenantId: { in: [tenantId, otherTenantId] } },
          { brokerUserId: { in: [brokerId, otherBrokerId] } },
        ],
      },
    })
    await prisma.brokerPublicProfile.update({
      where: { userId: brokerId },
      data: { status: 'DRAFT' },
    })
  })
  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenantId] } } })
    await prisma.$disconnect()
  })
  const context = (kind = 'broker') => ({ params: Promise.resolve({ kind }) })
  function request(method: string, token?: string, body?: unknown, query = '') {
    return new NextRequest(`http://localhost/api/marketplace/profiles/broker/address${query}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        'content-type': 'application/json',
        'accept-language': 'en',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }

  it('derives the target from authentication, normalizes names and records the editor', async () => {
    const saved = await PUT(
      request('PUT', brokerToken, { handle: `  Broker-${suffix.toUpperCase()}  ` }),
      context(),
    )
    expect(saved.status).toBe(200)
    expect(await saved.json()).toEqual({
      kind: 'broker',
      profileId: brokerId,
      handle: `broker-${suffix}`,
    })
    expect(
      (await prisma.publicProfileAddress.findUnique({ where: { brokerUserId: brokerId } }))
        ?.updatedById,
    ).toBe(brokerId)
    const own = await GET(request('GET', ownerToken), context('agency'))
    expect(await own.json()).toEqual({ kind: 'agency', profileId: tenantId, handle: null })
    expect(own.headers.get('Cache-Control')).toBe('no-store')
  })
  it('requires authentication and the matching profile role', async () => {
    expect((await GET(request('GET'), context())).status).toBe(401)
    expect(
      (await PUT(request('PUT', brokerToken, { handle: `test-${suffix}` }), context('agency')))
        .status,
    ).toBe(403)
    expect(
      (await PUT(request('PUT', ownerToken, { handle: `test-${suffix}` }), context())).status,
    ).toBe(403)
  })
  it('rejects reserved/invalid handles and injected ownership fields', async () => {
    for (const handle of [
      'ab',
      'with space',
      'a--b',
      '-initial',
      'final-',
      'álvaro',
      'a'.repeat(41),
      'admin',
      'ketris',
    ]) {
      expect((await PUT(request('PUT', brokerToken, { handle }), context())).status).toBe(400)
    }
    expect(
      (
        await PUT(
          request('PUT', brokerToken, { handle: `safe-${suffix}`, brokerUserId: otherBrokerId }),
          context(),
        )
      ).status,
    ).toBe(400)
    expect(await repo.findByProfile({ kind: 'broker', profileId: otherBrokerId })).toBeNull()
  })
  it('shares a namespace across brokers/agencies and keeps the previous address on conflict', async () => {
    await repo.save({ kind: 'broker', profileId: brokerId }, `broker-${suffix}`, brokerId)
    await repo.save({ kind: 'agency', profileId: tenantId }, `agency-${suffix}`, ownerId)
    const conflict = await PUT(
      request('PUT', ownerToken, { handle: `broker-${suffix}` }),
      context('agency'),
    )
    expect(conflict.status).toBe(409)
    expect(await conflict.json()).toEqual({
      error: {
        code: 'PUBLIC_PROFILE_ADDRESS_TAKEN',
        message: 'This address is already in use. Choose another name.',
      },
    })
    expect((await repo.findByProfile({ kind: 'agency', profileId: tenantId }))?.handle).toBe(
      `agency-${suffix}`,
    )
    const unavailable = await AVAILABILITY(
      request('GET', ownerToken, undefined, `/availability?handle=broker-${suffix}`),
      context('agency'),
    )
    expect(await unavailable.json()).toEqual({ available: false })
    const ownAvailable = await AVAILABILITY(
      request('GET', brokerToken, undefined, `/availability?handle=broker-${suffix}`),
      context(),
    )
    expect(await ownAvailable.json()).toEqual({ available: true })
  })
  it('releases a replaced handle immediately without keeping an alias', async () => {
    const target = { kind: 'broker' as const, profileId: brokerId }
    await repo.save(target, `old-${suffix}`, brokerId)
    await repo.save(target, `new-${suffix}`, brokerId)
    expect(await repo.findByHandle(`old-${suffix}`)).toBeNull()
    expect(await repo.findByHandle(`new-${suffix}`)).toEqual({ ...target, handle: `new-${suffix}` })
    await repo.save({ kind: 'broker', profileId: otherBrokerId }, `old-${suffix}`, otherBrokerId)
    expect((await repo.findByHandle(`old-${suffix}`))?.profileId).toBe(otherBrokerId)
  })
  it('allows exactly one concurrent claim and preserves the losing profile’s previous name', async () => {
    await repo.save({ kind: 'broker', profileId: brokerId }, `first-${suffix}`, brokerId)
    await repo.save({ kind: 'broker', profileId: otherBrokerId }, `second-${suffix}`, otherBrokerId)
    const results = await Promise.allSettled([
      repo.save({ kind: 'broker', profileId: brokerId }, `shared-${suffix}`, brokerId),
      repo.save({ kind: 'broker', profileId: otherBrokerId }, `shared-${suffix}`, otherBrokerId),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const failure = results.find((result) => result.status === 'rejected')
    expect(failure?.status === 'rejected' && failure.reason).toBeInstanceOf(
      PublicProfileAddressTakenError,
    )
    const loserIndex = results.findIndex((result) => result.status === 'rejected')
    const loserId = loserIndex === 0 ? brokerId : otherBrokerId
    expect((await repo.findByProfile({ kind: 'broker', profileId: loserId }))?.handle).toBe(
      `${loserIndex === 0 ? 'first' : 'second'}-${suffix}`,
    )
  })
  it('does not publish a draft by assigning an address and updates sitemap URLs upon publication', async () => {
    await repo.save({ kind: 'broker', profileId: brokerId }, `published-${suffix}`, brokerId)
    expect(
      (await listPublicSitemapRecords('brokers', 0)).some((record) => record.id === brokerId),
    ).toBe(false)
    await expect(
      marketplaceContainer.getBrokerProfileUseCase.execute({ id: brokerId }),
    ).rejects.toMatchObject({ status: 404 })
    await prisma.brokerPublicProfile.update({
      where: { userId: brokerId },
      data: { status: 'PUBLISHED' },
    })
    const record = (await listPublicSitemapRecords('brokers', 0)).find(
      (record) => record.id === brokerId,
    )
    expect(record?.handle).toBe(`published-${suffix}`)
    expect(getRecordHref('brokers', record!)).toEqual({
      pathname: '/p/[handle]',
      params: { handle: `published-${suffix}` },
    })
  })
  it('enforces a single valid target at the database boundary', async () => {
    await expect(
      prisma.publicProfileAddress.create({ data: { handle: `empty-${suffix}` } }),
    ).rejects.toThrow()
    await expect(
      prisma.publicProfileAddress.create({
        data: { handle: `double-${suffix}`, brokerUserId: brokerId, agencyTenantId: tenantId },
      }),
    ).rejects.toThrow()
    await expect(
      prisma.publicProfileAddress.create({
        data: { handle: 'Invalid Handle', brokerUserId: brokerId },
      }),
    ).rejects.toThrow()
  })
})
