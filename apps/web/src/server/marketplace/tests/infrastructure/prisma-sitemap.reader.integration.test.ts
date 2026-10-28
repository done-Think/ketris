import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { GET } from '@/app/sitemaps/[kind]/[page]/route'
import { prisma } from '@server/db/prisma'

import {
  countPublicSitemapRecords,
  listPublicSitemapRecords,
} from '../../infrastructure/prisma-sitemap.reader'

describe('public sitemap records', () => {
  const token = randomUUID()
  const tenantId = `0000-sitemap-tenant-${token}`
  const userId = `0000-sitemap-user-${token}`
  const propertyId = `0000-sitemap-property-${token}`
  let countsBefore: Awaited<ReturnType<typeof countPublicSitemapRecords>>

  beforeAll(async () => {
    countsBefore = await countPublicSitemapRecords()
    await prisma.tenant.create({
      data: { id: tenantId, name: 'Canonical Agency', slug: `sitemap-${token}`, status: 'ACTIVE' },
    })
    await prisma.user.create({
      data: {
        id: userId,
        tenantId,
        name: 'Public Broker',
        email: `sitemap-${token}@example.test`,
        passwordHash: 'unused',
        role: 'AGENT',
        membershipApprovedAt: new Date(),
      },
    })
    await prisma.property.create({
      data: {
        id: propertyId,
        tenantId,
        responsibleId: userId,
        title: 'Public property',
        purpose: 'SALE',
        type: 'APARTMENT',
        price: 100000,
        status: 'PUBLISHED',
      },
    })
    await prisma.brokerPublicProfile.create({
      data: {
        id: `0000-sitemap-broker-${token}`,
        userId,
        displayName: 'Public Broker',
        status: 'PUBLISHED',
      },
    })
    await prisma.agencyPublicProfile.create({
      data: {
        id: `0000-sitemap-agency-${token}`,
        tenantId,
        displayName: 'Canonical Agency',
        legalCreci: 'CRECI J-12345',
        status: 'PUBLISHED',
      },
    })
  })

  afterEach(async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { active: true, membershipApprovedAt: new Date() },
    })
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'ACTIVE' } })
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('counts and renders published records with localized URLs and the canonical agency slug', async () => {
    expect(await countPublicSitemapRecords()).toEqual({
      properties: countsBefore.properties + 1,
      brokers: countsBefore.brokers + 1,
      agencies: countsBefore.agencies + 1,
    })
    expect(
      (await listPublicSitemapRecords('properties', 0)).some(({ id }) => id === propertyId),
    ).toBe(true)

    const response = await GET(new Request('http://localhost/sitemaps/agencies/0.xml'), {
      params: Promise.resolve({ kind: 'agencies', page: '0.xml' }),
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8')
    const xml = await response.text()
    expect(xml).toContain('/pt/imobiliarias/canonical-agency/12345</loc>')
    expect(xml).toContain('/en/agencies/canonical-agency/12345</loc>')
    expect(xml).toContain('/es/inmobiliarias/canonical-agency/12345</loc>')
    expect(xml).toContain('hreflang="x-default"')
  })

  it.each([{ active: false }, { membershipApprovedAt: null }])(
    'immediately excludes ineligible brokers without removing their published profile: %j',
    async (changes) => {
      await prisma.user.update({ where: { id: userId }, data: changes })
      expect((await countPublicSitemapRecords()).brokers).toBe(countsBefore.brokers)
      expect((await listPublicSitemapRecords('brokers', 0)).some(({ id }) => id === userId)).toBe(
        false,
      )
      expect((await prisma.brokerPublicProfile.findUnique({ where: { userId } }))?.status).toBe(
        'PUBLISHED',
      )
    },
  )

  it('immediately removes broker and agency sitemap entries for a suspended tenant', async () => {
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'SUSPENDED' } })
    const counts = await countPublicSitemapRecords()
    expect(counts.brokers).toBe(countsBefore.brokers)
    expect(counts.agencies).toBe(countsBefore.agencies)
    expect((await listPublicSitemapRecords('brokers', 0)).some(({ id }) => id === userId)).toBe(
      false,
    )
    expect((await listPublicSitemapRecords('agencies', 0)).some(({ id }) => id === tenantId)).toBe(
      false,
    )
    expect((await prisma.agencyPublicProfile.findUnique({ where: { tenantId } }))?.status).toBe(
      'PUBLISHED',
    )
  })

  it('rejects invalid pagination before attempting a record query', async () => {
    await expect(listPublicSitemapRecords('properties', -1)).rejects.toThrow(RangeError)
    await expect(listPublicSitemapRecords('properties', 1.5)).rejects.toThrow(RangeError)
    await expect(listPublicSitemapRecords('properties', Number.MAX_SAFE_INTEGER)).rejects.toThrow(
      RangeError,
    )
  })
})
