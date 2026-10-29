import type { UserRole } from '@server/auth/domain/user.entity'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import type { UploadMaintenanceAttachmentInput } from '@server/maintenance/types/maintenance-attachment-storage'
import type { MaintenanceTicketStatus } from '@server/maintenance/types/maintenance-ticket'
import { NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect } from 'vitest'
import { POST as act } from '../../tickets/[id]/actions/route'
import { POST } from '../../tickets/route'
import { uploadToStorage } from './maintenance-storage'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

export function setupMaintenanceIntegration() {
  const tokenService = new JoseTokenService()

  const tenantIds: string[] = []

  let fixture: Awaited<ReturnType<typeof createFixture>>

  let other: Awaited<ReturnType<typeof createFixture>>

  async function createFixture() {
    const tenant = await prisma.tenant.create({
      data: { name: 'Maintenance Test', slug: `maintenance-${randomUUID()}` },
    })
    tenantIds.push(tenant.id)
    async function user(role: UserRole) {
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: role,
          email: `${randomUUID()}@maintenance.test`,
          passwordHash: 'test-hash',
          role: role,
        },
      })
      return { ...user, token: await tokenService.sign(user) }
    }
    const admin = await user('OWNER'),
      agent = await user('AGENT'),
      owner = await user('PROPERTY_OWNER'),
      renter = await user('RENTER'),
      unrelated = await user('RENTER'),
      unrelatedOwner = await user('PROPERTY_OWNER'),
      unrelatedAgent = await user('AGENT')
    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        responsibleId: agent.id,
        ownerId: owner.id,
        title: 'Test Property',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2500,
      },
    })
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        responsibleId: await propertyResponsibleId(prisma, property.id),
        interestedName: renter.name,
        interestedEmail: renter.email,
        proposedValue: 2500,
        status: 'ACCEPTED',
      },
    })
    const contract = await prisma.contract.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        sourceOpportunityId: opportunity.id,
        code: `TEST-${randomUUID()}`,
        amount: 2500,
        dueDay: 5,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
        status: 'ACTIVE',
        parties: {
          create: {
            role: 'RENTER',
            name: renter.name,
            cpf: '00000000000',
            email: renter.email,
            userId: renter.id,
          },
        },
      },
      include: { parties: true },
    })
    return {
      tenant,
      admin,
      agent,
      owner,
      renter,
      unrelated,
      unrelatedOwner,
      unrelatedAgent,
      property,
      contract,
    }
  }

  beforeAll(async () => {
    uploadToStorage.mockImplementation(async (input: UploadMaintenanceAttachmentInput) => ({
      url: `/api/maintenance/media/maintenance/${input.tenantId}/${randomUUID()}.png`,
      contentType: input.contentType,
    }))
    fixture = await createFixture()
    other = await createFixture()
  })

  afterAll(async () => {
    for (const tenantId of tenantIds) {
      await prisma.providerChangeRequest.deleteMany({ where: { ticket: { tenantId } } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  function request(path: string, method: string, token?: string, body?: unknown) {
    return new NextRequest(`http://localhost/api/maintenance/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }

  const context = (id: string) => ({ params: Promise.resolve({ id }) })

  const payload = {
    title: 'Leak',
    description: 'Kitchen leak',
    category: 'PLUMBING',
    priority: 'NORMAL',
  }

  async function create(token = fixture.renter.token) {
    const response = await POST(
      request('tickets', 'POST', token, { ...payload, contractId: fixture.contract.id }),
    )
    expect(response.status).toBe(201)
    return (await response.json()).ticket.id as string
  }

  async function action(id: string, token: string, body: unknown) {
    return act(request(`tickets/${id}/actions`, 'POST', token, body), context(id))
  }

  function attachmentRequest(id: string, token: string) {
    const formData = new FormData()
    formData.set('file', new File(['test image'], 'repair.png', { type: 'image/png' }))
    return new NextRequest(`http://localhost/api/maintenance/tickets/${id}/attachments`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: formData,
    })
  }
  async function legacyTicket(status: MaintenanceTicketStatus = 'CLOSED', archived = false) {
    return prisma.maintenanceTicket.create({
      data: {
        tenantId: fixture.tenant.id,
        propertyId: fixture.property.id,
        category: 'PLUMBING',
        title: 'Legacy ticket',
        description: 'Existing record',
        openedById: fixture.admin.id,
        openedByName: fixture.admin.name,
        status,
        resolvedAt: ['RESOLVED', 'CLOSED'].includes(status) ? new Date('2026-09-01') : null,
        deletedAt: archived ? new Date('2026-09-02') : null,
        deletedById: archived ? fixture.admin.id : null,
        completedById: fixture.agent.id,
        completedByRole: 'AGENT',
        activities: { create: { type: 'NOTE', message: 'Historical note' } },
        attachments: { create: { name: 'Historical photo', url: '/existing-photo.png' } },
      },
      include: { activities: true, attachments: true },
    })
  }

  async function anotherContract(propertyId = fixture.property.id) {
    const renter = await prisma.user.create({
      data: {
        tenantId: fixture.tenant.id,
        name: 'Alternate contract renter',
        email: `${randomUUID()}@maintenance.test`,
        passwordHash: 'test-hash',
        role: 'RENTER',
      },
    })
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId: fixture.tenant.id,
        propertyId: propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: renter.name,
        interestedEmail: renter.email,
        proposedValue: 2500,
        status: 'ACCEPTED',
      },
    })
    const contract = await prisma.contract.create({
      data: {
        tenantId: fixture.tenant.id,
        propertyId: propertyId,
        sourceOpportunityId: opportunity.id,
        code: `TEST-${randomUUID()}`,
        amount: 2500,
        dueDay: 5,
        startDate: new Date('2027-01-01'),
        endDate: new Date('2028-01-01'),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
        parties: {
          create: {
            role: 'RENTER',
            name: renter.name,
            cpf: '00000000000',
            email: renter.email,
            userId: renter.id,
          },
        },
      },
    })
    return { ...contract, renterToken: await tokenService.sign(renter) }
  }
  return {
    legacyTicket,
    anotherContract,
    get fixture() {
      return fixture
    },
    get other() {
      return other
    },
    request,
    context,
    payload,
    create,
    action,
    attachmentRequest,
    uploadToStorage,
  }
}
