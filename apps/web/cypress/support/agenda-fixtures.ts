import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getDatabaseUrl } from '../../src/server/db/database-url'
import type { AgendaFixtureSeedInput, AgendaFixtureSeedResult } from '../types/agenda-fixtures'
import { propertyResponsibleId } from '../../src/server/shared/tests/fixtures/property-responsible'

function assertIsolatedAgendaDatabase() {
  const url = new URL(getDatabaseUrl())
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    process.env.KETRIS_E2E_ISOLATED_DB !== '1'
  )
    throw new Error('Fixtures de Agenda exigem banco local isolado e KETRIS_E2E_ISOLATED_DB=1.')
}

export async function seedAgendaFixtures(
  prisma: PrismaClient,
  { suffix, password }: AgendaFixtureSeedInput,
): Promise<AgendaFixtureSeedResult> {
  assertIsolatedAgendaDatabase()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador de fixture inválido.')
  const tenant = await prisma.tenant.create({
    data: { name: 'Agenda E2E', slug: `agenda-e2e-agency-${suffix}`, accountType: 'AGENCY' },
  })
  const foreign = await prisma.tenant.create({
    data: {
      name: 'Outra imobiliária E2E',
      slug: `agenda-e2e-other-${suffix}`,
      accountType: 'AGENCY',
    },
  })
  const renters = await prisma.tenant.create({
    data: {
      name: 'Locatários E2E',
      slug: `agenda-e2e-renters-${suffix}`,
      accountType: 'INDIVIDUAL',
    },
  })
  const passwordHash = await bcrypt.hash(password, 10)
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora Agenda E2E',
      email: `owner-${suffix}@agenda.example.test`,
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const agent = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Corretora Agenda E2E',
      email: `agent-${suffix}@agenda.example.test`,
      passwordHash,
      role: 'AGENT',
      emailVerifiedAt: new Date(),
      membershipApprovedAt: new Date(),
    },
  })
  const renter = await prisma.user.create({
    data: {
      tenantId: renters.id,
      name: 'Locatária Agenda E2E',
      email: `renter-${suffix}@agenda.example.test`,
      passwordHash,
      role: 'RENTER',
      emailVerifiedAt: new Date(),
    },
  })
  const outsider = await prisma.user.create({
    data: {
      tenantId: foreign.id,
      name: 'Outra gestão',
      email: `foreign-${suffix}@agenda.example.test`,
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  let propertyId = ''
  for (let index = 0; index < 26; index++) {
    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        responsibleId: agent.id,
        title: `Imóvel E2E ${String(index).padStart(2, '0')}`,
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1000,
      },
    })
    if (index === 0) propertyId = property.id
  }
  const privateProperty = await prisma.property.create({
    data: {
      tenantId: foreign.id,
      responsibleId: outsider.id,
      title: 'Privado de outra imobiliária',
      purpose: 'SALE',
      type: 'APARTMENT',
      price: 100000,
    },
  })
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: tenant.id,
      propertyId: propertyId,
      responsibleId: await propertyResponsibleId(prisma, propertyId),
      interestedName: renter.name,
      interestedEmail: renter.email,
      proposedValue: 1000,
      status: 'ACCEPTED',
    },
  })
  await prisma.contract.create({
    data: {
      tenantId: tenant.id,
      propertyId: propertyId,
      sourceOpportunityId: opportunity.id,
      code: `AGENDA-E2E-${suffix}`,
      amount: 1000,
      dueDay: 5,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2035-01-01'),
      adjustmentIndex: 'IPCA',
      guaranteeType: 'DEPOSIT',
      status: 'ACTIVE',
      activatedAt: new Date(),
      activatedById: owner.id,
      parties: {
        create: {
          userId: renter.id,
          role: 'RENTER',
          name: renter.name,
          email: renter.email,
          cpf: '00000000000',
        },
      },
    },
  })
  return {
    tenantIds: [tenant.id, foreign.id, renters.id],
    tenantId: tenant.id,
    ownerId: owner.id,
    agentId: agent.id,
    renterId: renter.id,
    ownerEmail: owner.email,
    agentEmail: agent.email,
    renterEmail: renter.email,
    ownerName: owner.name,
    propertyId,
    privatePropertyId: privateProperty.id,
  }
}

export async function cleanupAgendaFixtures(prisma: PrismaClient, tenantIds: string[]) {
  assertIsolatedAgendaDatabase()
  for (const id of tenantIds)
    await prisma.tenant.deleteMany({ where: { id, slug: { startsWith: 'agenda-e2e-' } } })
  return null
}

export async function readAgendaAudit(prisma: PrismaClient, eventId: string) {
  assertIsolatedAgendaDatabase()
  return prisma.agendaEventAudit.findMany({
    where: { eventId, event: { tenant: { slug: { startsWith: 'agenda-e2e-' } } } },
    orderBy: { createdAt: 'asc' },
    select: { action: true, actorUserId: true, cancellationReason: true },
  })
}
