import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { prisma } from '@server/db/prisma'

import { InquiryQuotaExceededError } from '../../domain/errors'
import { inquiryContactRateLimitKey } from '../../infrastructure/inquiry-rate-limit'
import { PrismaInquiryRepository } from '../../infrastructure/prisma-inquiry.repository'
import type { NewInquiry } from '../../types/inquiry'

describe('transactional inquiry contact quota', () => {
  const email = `quota-${randomUUID()}@example.test`
  let tenantId: string
  let propertyId: string
  const repositories = [new PrismaInquiryRepository(), new PrismaInquiryRepository()]

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Inquiry quota', slug: `quota-${randomUUID()}` },
    })
    tenantId = tenant.id
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'Responsible',
        email: `owner-${randomUUID()}@example.test`,
        passwordHash: 'unused',
        role: 'OWNER',
      },
    })
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: user.id,
        title: 'Quota property',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1000,
        status: 'PUBLISHED',
      },
    })
    propertyId = property.id
  })

  afterEach(async () => {
    await prisma.lead.deleteMany({ where: { tenantId } })
    await prisma.opportunity.deleteMany({ where: { tenantId } })
    await prisma.authRateLimitBucket.deleteMany({
      where: {
        key: `marketplace-property-contact:${inquiryContactRateLimitKey(propertyId, email)}`,
      },
    })
    vi.unstubAllEnvs()
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function inquiry(changes: Partial<NewInquiry> = {}): NewInquiry {
    return {
      tenantId,
      propertyId,
      leadName: 'Visitor',
      leadEmail: email,
      leadPhone: null,
      proposedValue: 900,
      notes: null,
      ...changes,
    }
  }

  it('accepts exactly the configured budget across concurrent repository instances and email casing', async () => {
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_LIMIT', '2')
    const outcomes = await Promise.allSettled(
      Array.from({ length: 8 }, (_, index) =>
        repositories[index % repositories.length].create(
          inquiry({ leadEmail: index % 2 ? email.toUpperCase() : email }),
        ),
      ),
    )
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(2)
    const failures = outcomes.filter((result) => result.status === 'rejected')
    expect(failures).toHaveLength(6)
    for (const result of failures)
      expect(result).toMatchObject({ reason: expect.any(InquiryQuotaExceededError) })
    expect(await prisma.opportunity.count({ where: { tenantId } })).toBe(2)
    expect(await prisma.lead.count({ where: { tenantId } })).toBe(2)
    const bucket = await prisma.authRateLimitBucket.findUniqueOrThrow({
      where: {
        key: `marketplace-property-contact:${inquiryContactRateLimitKey(propertyId, email)}`,
      },
    })
    expect(bucket.key).not.toContain(email)
    expect(bucket.count).toBe(2)
  })

  it('starts a fresh budget only after the shared expiry', async () => {
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_LIMIT', '1')
    await repositories[0].create(inquiry())
    await expect(repositories[1].create(inquiry())).rejects.toThrow(InquiryQuotaExceededError)
    await prisma.authRateLimitBucket.update({
      where: {
        key: `marketplace-property-contact:${inquiryContactRateLimitKey(propertyId, email)}`,
      },
      data: { resetAt: new Date(Date.now() - 1000) },
    })
    await expect(repositories[1].create(inquiry())).resolves.toMatchObject({ leadEmail: email })
  })

  it('rolls back quota consumption if storing the proposal fails', async () => {
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_LIMIT', '1')
    await expect(repositories[0].create(inquiry({ proposedValue: 1e30 }))).rejects.toThrow()
    expect(
      await prisma.authRateLimitBucket.findUnique({
        where: {
          key: `marketplace-property-contact:${inquiryContactRateLimitKey(propertyId, email)}`,
        },
      }),
    ).toBeNull()
    await expect(repositories[1].create(inquiry())).resolves.toMatchObject({ leadEmail: email })
  })

  it('rolls back the opportunity and quota when persisting its lead fails', async () => {
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION reject_inquiry_lead_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.name = 'Rejected lead fixture' THEN RAISE EXCEPTION 'Fixture rejected'; END IF; RETURN NEW; END $$`,
    )
    await prisma.$executeRawUnsafe(
      'CREATE TRIGGER reject_inquiry_lead_test BEFORE INSERT ON leads FOR EACH ROW EXECUTE FUNCTION reject_inquiry_lead_test()',
    )
    try {
      await expect(
        repositories[0].create(inquiry({ leadName: 'Rejected lead fixture' })),
      ).rejects.toThrow()
      expect(await prisma.opportunity.count({ where: { tenantId } })).toBe(0)
      expect(await prisma.lead.count({ where: { tenantId } })).toBe(0)
      expect(
        await prisma.authRateLimitBucket.findUnique({
          where: {
            key: `marketplace-property-contact:${inquiryContactRateLimitKey(propertyId, email)}`,
          },
        }),
      ).toBeNull()
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_inquiry_lead_test ON leads')
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_inquiry_lead_test()')
    }
    await expect(repositories[0].create(inquiry())).resolves.toMatchObject({ leadEmail: email })
  })
})
