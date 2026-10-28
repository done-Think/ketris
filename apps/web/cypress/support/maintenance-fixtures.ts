import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getDatabaseUrl } from '../../src/server/db/database-url'
import type {
  MaintenanceFixtureInput,
  MaintenanceFixtureResult,
  MaintenanceEvidence,
} from '../types/maintenance-fixtures'
import { propertyResponsibleId } from '../../src/server/shared/tests/fixtures/property-responsible'
function isolated() {
  if (
    process.env.KETRIS_E2E_ISOLATED_DB !== '1' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(getDatabaseUrl()).hostname)
  )
    throw new Error('Maintenance E2E exige banco local isolado.')
}
export async function seedMaintenanceFixtures(
  prisma: PrismaClient,
  { suffix, password }: MaintenanceFixtureInput,
): Promise<MaintenanceFixtureResult> {
  isolated()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador inválido.')
  const tenant = await prisma.tenant.create({
    data: { name: 'Maintenance E2E', slug: 'maintenance-e2e-' + suffix, accountType: 'AGENCY' },
  })
  const renters = await prisma.tenant.create({
    data: { name: 'Locatários Maintenance E2E', slug: 'maintenance-e2e-renters-' + suffix },
  })
  const passwordHash = await bcrypt.hash(password, 10)
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora Maintenance E2E',
      email: 'owner-' + suffix + '@maintenance.example.test',
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const renter = await prisma.user.create({
    data: {
      tenantId: renters.id,
      name: 'Locatário Maintenance E2E',
      email: 'renter-' + suffix + '@maintenance.example.test',
      passwordHash,
      role: 'RENTER',
      emailVerifiedAt: new Date(),
    },
  })
  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: owner.id,
      title: 'Apartamento Maintenance E2E',
      purpose: 'RENT',
      type: 'APARTMENT',
      price: 2000,
    },
  })
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      responsibleId: await propertyResponsibleId(prisma, property.id),
      interestedName: renter.name,
      interestedEmail: renter.email,
      proposedValue: 2000,
      status: 'ACCEPTED',
    },
  })
  const contract = await prisma.contract.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      sourceOpportunityId: opportunity.id,
      code: 'MNT-E2E-001',
      amount: 2000,
      dueDay: 5,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2030-01-01'),
      adjustmentIndex: 'IPCA',
      guaranteeType: 'DEPOSIT',
      status: 'ACTIVE',
      parties: {
        create: {
          role: 'RENTER',
          name: renter.name,
          email: renter.email,
          cpf: '00000000000',
          userId: renter.id,
        },
      },
    },
  })
  let ticketId = ''
  for (let index = 0; index < 6; index++) {
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        tenantId: tenant.id,
        contractId: contract.id,
        propertyId: property.id,
        category: 'PLUMBING',
        title: 'Chamado E2E ' + index,
        description: 'Vazamento na cozinha',
        openedById: renter.id,
        openedByName: renter.name,
        priority: index === 0 ? 'URGENT' : 'NORMAL',
      },
    })
    if (index === 0) ticketId = ticket.id
  }
  return {
    tenantIds: [tenant.id, renters.id],
    ownerEmail: owner.email,
    renterEmail: renter.email,
    ticketId,
    propertyTitle: property.title,
    contractCode: contract.code,
  }
}
export async function cleanupMaintenanceFixtures(prisma: PrismaClient, tenantIds: string[]) {
  isolated()
  await prisma.tenant.deleteMany({
    where: { id: { in: tenantIds }, slug: { startsWith: 'maintenance-e2e-' } },
  })
  return null
}
export async function readMaintenanceEvidence(
  prisma: PrismaClient,
  id: string,
): Promise<MaintenanceEvidence> {
  isolated()
  const ticket = await prisma.maintenanceTicket.findFirstOrThrow({
    where: { id, tenant: { slug: { startsWith: 'maintenance-e2e-' } } },
    include: { attachments: true, activities: true },
  })
  return {
    providerName: ticket.providerName,
    providerId: ticket.providerId,
    attachmentCount: ticket.attachments.length,
    uploadId: ticket.attachments[0]?.uploadId ?? null,
    status: ticket.status,
    actions: ticket.activities.map((activity) => activity.systemAction),
  }
}
