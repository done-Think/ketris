import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../../src/server/db/database-url'
import type { TeamEvidence, TeamFixtureInput, TeamFixtureResult } from '../types/team-fixtures'

const slugPrefix = 'team-e2e-'

function isolated() {
  if (
    process.env.KETRIS_E2E_ISOLATED_DB !== '1' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(getDatabaseUrl()).hostname)
  )
    throw new Error('Team E2E exige banco local isolado.')
}

export async function seedTeamFixtures(
  prisma: PrismaClient,
  { suffix, password }: TeamFixtureInput,
): Promise<TeamFixtureResult> {
  isolated()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador inválido.')
  const tenant = await prisma.tenant.create({
    data: { name: 'Imobiliária Equipe E2E', slug: slugPrefix + suffix, accountType: 'AGENCY' },
  })
  const passwordHash = await bcrypt.hash(password, 10)
  const ownerEmail = 'owner-' + suffix + '@team.example.test'
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora Equipe',
      email: ownerEmail,
      passwordHash,
      role: 'OWNER',
    },
  })
  const sourceName = 'Ana Origem ' + suffix
  const destinationName = 'Bruno Destino ' + suffix
  const source = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: sourceName,
      email: 'ana-' + suffix + '@team.example.test',
      phone: '(41) 99999-1111',
      passwordHash,
      role: 'AGENT',
    },
  })
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: destinationName,
      email: 'bruno-' + suffix + '@team.example.test',
      passwordHash,
      role: 'AGENT',
    },
  })
  for (const index of [1, 2, 3]) {
    await prisma.property.create({
      data: {
        tenantId: tenant.id,
        responsibleId: source.id,
        title: 'Imóvel Equipe ' + index + ' ' + suffix,
        description: 'Imóvel da carteira da corretora de origem.',
        purpose: 'SALE',
        type: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 1,
        parkingSpots: 1,
        areaSqm: 70,
        price: 400000 + index,
        status: 'PUBLISHED',
      },
    })
  }
  const property = await prisma.property.findFirstOrThrow({
    where: { tenantId: tenant.id, responsibleId: source.id },
  })
  await prisma.opportunity.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      responsibleId: source.id,
      interestedName: 'Interessada Equipe',
      interestedEmail: 'interessada-' + suffix + '@team.example.test',
      proposedValue: 390000,
      status: 'SENT',
    },
  })
  const contactedAt = new Date()
  for (const index of [1, 2]) {
    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        responsibleId: source.id,
        name: 'Lead Equipe ' + index,
        phone: '41999990000',
        interest: 'Apartamento',
        budget: 'A combinar',
        source: 'WEBSITE',
        stage: index === 1 ? 'NEW' : 'IN_CONTACT',
        firstContactAt: index === 1 ? null : contactedAt,
        createdAt: new Date(contactedAt.getTime() - 30 * 60_000),
      },
    })
  }

  return { tenantIds: [tenant.id], ownerEmail, sourceName, destinationName }
}

export async function cleanupTeamFixtures(prisma: PrismaClient, tenantIds: string[]) {
  isolated()
  const where = { tenantId: { in: tenantIds }, tenant: { slug: { startsWith: slugPrefix } } }
  await prisma.$transaction([
    prisma.opportunity.deleteMany({ where }),
    prisma.lead.deleteMany({ where }),
    prisma.property.deleteMany({ where }),
    prisma.tenant.deleteMany({
      where: { id: { in: tenantIds }, slug: { startsWith: slugPrefix } },
    }),
  ])
  return null
}

export async function readTeamEvidence(
  prisma: PrismaClient,
  input: { tenantId: string; sourceName: string; destinationName: string; invitedEmail: string },
): Promise<TeamEvidence> {
  isolated()
  const [source, destination, invited] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { tenantId: input.tenantId, name: input.sourceName },
    }),
    prisma.user.findFirstOrThrow({
      where: { tenantId: input.tenantId, name: input.destinationName },
    }),
    prisma.user.findFirst({
      where: { tenantId: input.tenantId, email: input.invitedEmail },
      include: { teamInvitation: true },
    }),
  ])
  const count = (model: 'property' | 'lead' | 'opportunity', responsibleId: string) =>
    model === 'property'
      ? prisma.property.count({ where: { tenantId: input.tenantId, responsibleId } })
      : model === 'lead'
        ? prisma.lead.count({ where: { tenantId: input.tenantId, responsibleId } })
        : prisma.opportunity.count({ where: { tenantId: input.tenantId, responsibleId } })
  const [
    sourceProperties,
    sourceLeads,
    destinationProperties,
    destinationLeads,
    sourceOpportunities,
    destinationOpportunities,
    goal,
    transfers,
  ] = await Promise.all([
    count('property', source.id),
    count('lead', source.id),
    count('property', destination.id),
    count('lead', destination.id),
    count('opportunity', source.id),
    count('opportunity', destination.id),
    prisma.brokerGoal.findFirst({
      where: { tenantId: input.tenantId, userId: source.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.portfolioTransfer.count({ where: { tenantId: input.tenantId } }),
  ])

  return {
    sourceActive: source.active,
    sourceProperties,
    sourceLeads,
    destinationProperties,
    destinationLeads,
    sourceOpportunities,
    destinationOpportunities,
    goal: goal?.monthlySales ?? null,
    transfers,
    invitedActive: invited ? invited.active : null,
    invitationAccepted: Boolean(invited?.teamInvitation?.acceptedAt),
  }
}
