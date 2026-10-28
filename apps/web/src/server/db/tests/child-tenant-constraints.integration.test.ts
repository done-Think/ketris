import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '../prisma'

describe('deployed composite tenant foreign keys for child records', () => {
  let tenantId: string
  let foreignTenantId: string
  let propertyId: string
  let contractId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant FK fixture', slug: `child-fk-${randomUUID()}` },
    })
    tenantId = tenant.id
    const foreignTenant = await prisma.tenant.create({
      data: { name: 'Foreign tenant FK fixture', slug: `child-fk-foreign-${randomUUID()}` },
    })
    foreignTenantId = foreignTenant.id
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'FK fixture owner',
        email: `child-fk-${randomUUID()}@example.test`,
        passwordHash: 'unused',
        role: 'OWNER',
      },
    })
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: user.id,
        title: 'FK fixture property',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1200,
      },
    })
    propertyId = property.id
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId,
        responsibleId: user.id,
        interestedName: 'FK fixture lead',
        interestedEmail: `child-fk-lead-${randomUUID()}@example.test`,
        proposedValue: 1100,
        status: 'ACCEPTED',
      },
    })
    const contract = await prisma.contract.create({
      data: {
        tenantId,
        propertyId,
        sourceOpportunityId: opportunity.id,
        code: `FK-${randomUUID()}`,
        amount: 1100,
        dueDay: 10,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
      },
    })
    contractId = contract.id
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.contract.deleteMany({ where: { tenantId } })
      await prisma.opportunity.deleteMany({ where: { tenantId } })
      await prisma.property.deleteMany({ where: { tenantId } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    if (foreignTenantId) await prisma.tenant.delete({ where: { id: foreignTenantId } })
    await prisma.$disconnect()
  })

  it('rejects a property address assigned to a different tenant and accepts the matching tenant', async () => {
    const address = {
      propertyId,
      street: 'Fixture street',
      number: '10',
      neighborhood: 'Fixture neighborhood',
      city: 'Fixture city',
      state: 'SP',
      zipCode: '00000000',
    }
    await expect(
      prisma.propertyAddress.create({ data: { ...address, tenantId: foreignTenantId } }),
    ).rejects.toMatchObject({ code: 'P2003' })
    expect(await prisma.propertyAddress.count({ where: { propertyId } })).toBe(0)
    expect(await prisma.propertyAddress.create({ data: { ...address, tenantId } })).toMatchObject({
      tenantId,
      propertyId,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
  })

  it('rejects property media assigned to a different tenant and accepts the matching tenant', async () => {
    const media = { propertyId, url: 'https://example.test/tenant-fk.jpg', type: 'PHOTO' as const }
    await expect(
      prisma.propertyMedia.create({ data: { ...media, tenantId: foreignTenantId } }),
    ).rejects.toMatchObject({ code: 'P2003' })
    expect(await prisma.propertyMedia.count({ where: { propertyId } })).toBe(0)
    expect(await prisma.propertyMedia.create({ data: { ...media, tenantId } })).toMatchObject({
      tenantId,
      propertyId,
      type: 'PHOTO',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
  })

  it('rejects a contract party assigned to a different tenant and accepts the matching tenant', async () => {
    const party = {
      contractId,
      role: 'LANDLORD' as const,
      name: 'Fixture party',
      cpf: '00000000000',
      email: `child-fk-party-${randomUUID()}@example.test`,
    }
    await expect(
      prisma.contractParty.create({ data: { ...party, tenantId: foreignTenantId } }),
    ).rejects.toMatchObject({ code: 'P2003' })
    expect(await prisma.contractParty.count({ where: { contractId } })).toBe(0)
    expect(await prisma.contractParty.create({ data: { ...party, tenantId } })).toMatchObject({
      tenantId,
      contractId,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
  })
})
