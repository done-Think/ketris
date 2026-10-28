import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST as linkUser } from '../../../contracts/[id]/parties/[partyId]/link-user/route'
import { GET as getCharge } from '../../charges/[id]/route'
import { GET as listCharges } from '../../charges/route'
import { GET as getSummary } from '../../summary/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('Renter financial authorization (integration)', () => {
  const tenantIds: string[] = []
  const tokenService = new JoseTokenService()
  let agencyId: string
  let otherAgencyId: string
  let sharedTenantId: string
  let admin: { id: string; token: string }
  let agent: { id: string; token: string }
  let renter: { id: string; token: string; email: string }
  let otherRenter: { id: string; token: string; email: string }
  let sameTenantRenter: { id: string; token: string; email: string }
  let owned: { id: string; partyId: string; chargeId: string }
  let otherAgencyOwned: { id: string; partyId: string; chargeId: string }
  let foreign: { id: string; partyId: string; chargeId: string }
  let unlinked: { id: string; partyId: string; chargeId: string }
  let payableId: string
  let standaloneId: string

  async function createTenant() {
    const tenant = await prisma.tenant.create({
      data: { name: 'Financial access test', slug: `financial-access-${randomUUID()}` },
    })
    tenantIds.push(tenant.id)
    return tenant.id
  }

  async function createUser(tenantId: string, role: 'OWNER' | 'AGENT' | 'RENTER') {
    const user = await prisma.user.create({
      data: {
        tenantId,
        role,
        name: role,
        email: `${randomUUID()}@example.com`,
        passwordHash: 'unused',
      },
    })
    return { ...user, token: await tokenService.sign(user) }
  }

  async function createContract(
    tenantId: string,
    responsibleId: string,
    email: string,
    userId: string | null,
  ) {
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: responsibleId,
        title: `Property ${randomUUID()}`,
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1000,
      },
    })
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: property.id,
        responsibleId: await propertyResponsibleId(prisma, property.id),
        interestedName: 'Renter',
        interestedEmail: email,
        proposedValue: 1000,
        status: 'ACCEPTED',
      },
    })
    const contract = await prisma.contract.create({
      data: {
        tenantId,
        propertyId: property.id,
        sourceOpportunityId: opportunity.id,
        code: `CTR-${randomUUID()}`,
        type: 'RESIDENTIAL',
        amount: 1000,
        dueDay: 5,
        startDate: new Date('2026-10-01'),
        endDate: new Date('2027-10-01'),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
        status: 'ACTIVE',
        parties: {
          create: {
            role: 'RENTER',
            name: 'Renter',
            cpf: '11111111111',
            email,
            userId: userId,
          },
        },
      },
      include: { parties: true },
    })
    const charge = await prisma.charge.create({
      data: {
        tenantId,
        contractId: contract.id,
        code: `COB-${randomUUID()}`,
        type: 'RECEIVABLE',
        amount: 1000,
        dueDate: new Date('2026-11-05'),
        status: 'PENDING',
      },
    })
    return { id: contract.id, partyId: contract.parties[0].id, chargeId: charge.id }
  }

  function request(path: string, token?: string, body?: unknown) {
    return new NextRequest(`http://localhost/api${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }

  function detail(id: string, token = renter.token) {
    return getCharge(request(`/financial/charges/${id}`, token), {
      params: Promise.resolve({ id }),
    })
  }

  function confirmLink(
    token: string,
    contract = unlinked,
    body: unknown = { email: renter.email },
  ) {
    return linkUser(
      request(`/contracts/${contract.id}/parties/${contract.partyId}/link-user`, token, body),
      {
        params: Promise.resolve({ id: contract.id, partyId: contract.partyId }),
      },
    )
  }

  beforeAll(async () => {
    agencyId = await createTenant()
    otherAgencyId = await createTenant()
    sharedTenantId = await createTenant()
    admin = await createUser(agencyId, 'OWNER')
    agent = await createUser(agencyId, 'AGENT')
    const otherAdmin = await createUser(otherAgencyId, 'OWNER')
    renter = await createUser(sharedTenantId, 'RENTER')
    otherRenter = await createUser(sharedTenantId, 'RENTER')
    sameTenantRenter = await createUser(agencyId, 'RENTER')
    owned = await createContract(agencyId, admin.id, renter.email, renter.id)
    otherAgencyOwned = await createContract(otherAgencyId, otherAdmin.id, renter.email, renter.id)
    foreign = await createContract(agencyId, admin.id, otherRenter.email, otherRenter.id)
    await prisma.contractParty.create({
      data: {
        contractId: foreign.id,
        tenantId: agencyId,
        role: 'LANDLORD',
        name: 'Owner party',
        cpf: '22222222222',
        email: renter.email,
        userId: renter.id,
      },
    })
    unlinked = await createContract(agencyId, admin.id, renter.email, null)
    const payable = await prisma.charge.create({
      data: {
        tenantId: agencyId,
        contractId: owned.id,
        code: `COB-${randomUUID()}`,
        type: 'PAYABLE',
        amount: 200,
        dueDate: new Date('2026-11-05'),
        description: 'Internal expense',
      },
    })
    payableId = payable.id
    const standalone = await prisma.charge.create({
      data: {
        tenantId: agencyId,
        code: `COB-${randomUUID()}`,
        type: 'RECEIVABLE',
        amount: 300,
        dueDate: new Date('2026-11-05'),
        description: 'Standalone charge',
      },
    })
    standaloneId = standalone.id
  })

  afterAll(async () => {
    if (tenantIds.length) {
      const where = { tenantId: { in: tenantIds } }
      await prisma.charge.deleteMany({ where })
      await prisma.contract.deleteMany({ where })
      await prisma.opportunity.deleteMany({ where })
      await prisma.property.deleteMany({ where })
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    }
    await prisma.$disconnect()
  })

  it('requires authentication on the association endpoint', async () => {
    const response = await linkUser(
      request('/contracts/x/parties/y/link-user', undefined, { email: 'x@example.com' }),
      {
        params: Promise.resolve({ id: 'x', partyId: 'y' }),
      },
    )
    expect(response.status).toBe(401)
  })

  it('lists only linked receivables across agencies and keeps pagination totals scoped', async () => {
    const response = await listCharges(request('/financial/charges?pageSize=1', renter.token))
    expect(response.status).toBe(200)
    const first = await response.json()
    const secondResponse = await listCharges(
      request('/financial/charges?pageSize=1&page=2', renter.token),
    )
    const second = await secondResponse.json()
    expect(first.totalCount).toBe(2)
    expect(second.totalCount).toBe(2)
    expect([first.items[0].id, second.items[0].id].sort()).toEqual(
      [owned.chargeId, otherAgencyOwned.chargeId].sort(),
    )
  })

  it('does not grant tenant-wide access to a renter in the agency tenant', async () => {
    const response = await listCharges(request('/financial/charges', sameTenantRenter.token))
    expect(await response.json()).toMatchObject({ items: [], totalCount: 0 })
  })

  it('does not let filters or search bypass the user link', async () => {
    const foreignCharge = await prisma.charge.findUniqueOrThrow({
      where: { id: foreign.chargeId },
    })
    const search = await listCharges(
      request(`/financial/charges?search=${foreignCharge.code}`, renter.token),
    )
    expect(await search.json()).toMatchObject({ items: [], totalCount: 0 })
    const payable = await listCharges(request('/financial/charges?type=PAYABLE', renter.token))
    expect(await payable.json()).toMatchObject({ items: [], totalCount: 0 })
  })

  it('returns linked details while denying foreign, unlinked, payable, standalone and missing charges', async () => {
    expect((await detail(owned.chargeId)).status).toBe(200)
    expect((await detail(otherAgencyOwned.chargeId)).status).toBe(200)
    for (const id of [foreign.chargeId, unlinked.chargeId, payableId, standaloneId, 'missing']) {
      const response = await detail(id)
      expect(response.status).toBe(404)
      expect(await response.json()).toMatchObject({ error: { code: 'CHARGE_NOT_FOUND' } })
    }
  })

  it('keeps authorized agency staff inside their tenant and blocks agents', async () => {
    expect((await detail(owned.chargeId, admin.token)).status).toBe(200)
    expect((await detail(otherAgencyOwned.chargeId, admin.token)).status).toBe(404)
    expect((await detail(owned.chargeId, agent.token)).status).toBe(403)
    expect((await listCharges(request('/financial/charges', agent.token))).status).toBe(403)
  })

  it('forbids renter access to financial summary', async () => {
    expect((await getSummary(request('/financial/summary', renter.token))).status).toBe(403)
  })

  it('does not create links when an account changes its email', async () => {
    await prisma.user.update({
      where: { id: renter.id },
      data: { email: `${randomUUID()}@example.com` },
    })
    try {
      expect((await detail(owned.chargeId)).status).toBe(200)
      expect((await detail(unlinked.chargeId)).status).toBe(404)
    } finally {
      await prisma.user.update({ where: { id: renter.id }, data: { email: renter.email } })
    }
  })

  it('denies reads for an inactive linked renter even with an existing token', async () => {
    await prisma.user.update({ where: { id: renter.id }, data: { active: false } })
    try {
      expect((await detail(owned.chargeId)).status).toBe(403)
      const response = await listCharges(request('/financial/charges', renter.token))
      expect(response.status).toBe(403)
      expect(await response.json()).toMatchObject({ error: { code: 'ACCOUNT_DEACTIVATED' } })
    } finally {
      await prisma.user.update({ where: { id: renter.id }, data: { active: true } })
    }
  })

  it('requires an administrator and rejects attempts to link contracts of another agency', async () => {
    expect((await confirmLink(renter.token)).status).toBe(403)
    expect((await confirmLink(agent.token)).status).toBe(403)
    expect((await confirmLink(admin.token, otherAgencyOwned)).status).toBe(404)
    expect((await detail(unlinked.chargeId)).status).toBe(404)
  })

  it('rejects a user ID supplied by the client', async () => {
    expect(
      (await confirmLink(admin.token, unlinked, { email: renter.email, userId: otherRenter.id }))
        .status,
    ).toBe(400)
  })

  it('confirms an existing unlinked party by normalized email and then grants access by ID', async () => {
    const response = await confirmLink(admin.token, unlinked, {
      email: ` ${renter.email.toUpperCase()} `,
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ partyId: unlinked.partyId, userId: renter.id })
    expect((await detail(unlinked.chargeId)).status).toBe(200)
    expect((await detail(unlinked.chargeId, otherRenter.token)).status).toBe(404)
    expect((await confirmLink(admin.token)).status).toBe(200)
  })

  it('does not transfer an existing link to a new account that reuses the old email', async () => {
    await prisma.user.update({
      where: { id: renter.id },
      data: { email: `${randomUUID()}@example.com` },
    })
    const replacement = await createUser(sharedTenantId, 'RENTER')
    try {
      await prisma.user.update({ where: { id: replacement.id }, data: { email: renter.email } })
      expect((await confirmLink(admin.token)).status).toBe(409)
      expect((await detail(unlinked.chargeId, replacement.token)).status).toBe(404)
      expect((await detail(unlinked.chargeId)).status).toBe(200)
      const party = await prisma.contractParty.findUniqueOrThrow({
        where: { id: unlinked.partyId },
      })
      expect(party.userId).toBe(renter.id)
    } finally {
      await prisma.user.delete({ where: { id: replacement.id } })
      await prisma.user.update({ where: { id: renter.id }, data: { email: renter.email } })
    }
  })
})
