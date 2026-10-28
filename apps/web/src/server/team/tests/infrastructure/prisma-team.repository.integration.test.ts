import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { hashTeamInvitationToken } from '../../domain/team-invitation-token'
import { PrismaTeamInvitationRepository } from '../../infrastructure/prisma-team-invitation.repository'
import { PrismaTeamRepository } from '../../infrastructure/prisma-team.repository'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

const repository = new PrismaTeamRepository()
const invitations = new PrismaTeamInvitationRepository()
const now = new Date()
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000)
const period = {
  now,
  monthStart: new Date(now.getFullYear(), now.getMonth(), 1),
  monthEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  responseWindowStart: minutesAgo(30 * 24 * 60),
}

describe('PrismaTeamRepository (integração)', () => {
  let tenantId: string
  let ownerId: string
  let sourceId: string
  let destinationId: string
  let propertyId: string
  let futureEventId: string
  let pastEventId: string

  async function user(name: string, role: 'OWNER' | 'AGENT') {
    return prisma.user.create({
      data: {
        tenantId,
        name: name,
        email: `${name.toLowerCase()}-${randomUUID()}@team.example.test`,
        passwordHash: 'hash-fake',
        role,
      },
    })
  }

  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({ data: { name: 'Equipe', slug: `team-${randomUUID()}` } })
    ).id
    ownerId = (await user('Dona', 'OWNER')).id
    sourceId = (await user('Marina', 'AGENT')).id
    destinationId = (await user('Thiago', 'AGENT')).id
    await prisma.brokerPublicProfile.create({
      data: {
        userId: sourceId,
        displayName: 'Marina',
        headline: 'Especialista em Jardins',
        specialties: ['Alto padrão'],
        phone: '11999990000',
        status: 'PUBLISHED',
        publishedAt: now,
      },
    })
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        title: 'Casa da equipe',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 500000,
        status: 'PUBLISHED',
      },
    })
    propertyId = property.id
    await prisma.property.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        title: 'Inativo',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 1,
        status: 'INACTIVE',
      },
    })
    await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        name: 'Lead aberto',
        phone: '1',
        interest: 'Compra',
        budget: '1',
        source: 'WEBSITE',
        createdAt: minutesAgo(120),
        firstContactAt: minutesAgo(100),
      },
    })
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: property.id,
        responsibleId: await propertyResponsibleId(prisma, property.id),
        interestedName: 'Comprador',
        interestedEmail: 'comprador@example.test',
        proposedValue: 480000,
        status: 'ACCEPTED',
        createdAt: minutesAgo(60),
      },
    })
    await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        name: 'Lead convertido',
        phone: '1',
        interest: 'Compra',
        budget: '1',
        source: 'WEBSITE',
        opportunityId: opportunity.id,
      },
    })
    await prisma.opportunityActivity.createMany({
      data: [
        {
          opportunityId: opportunity.id,
          type: 'CONTACT_MADE',
          description: '',
          authorId: sourceId,
          createdAt: minutesAgo(20),
        },
        {
          opportunityId: opportunity.id,
          type: 'NOTE',
          description: '',
          authorId: sourceId,
          createdAt: minutesAgo(10),
        },
      ],
    })
    await prisma.contract.create({
      data: {
        tenantId,
        propertyId: property.id,
        sourceOpportunityId: opportunity.id,
        code: `TEAM-${randomUUID()}`,
        amount: 480000,
        dueDay: 5,
        startDate: now,
        endDate: new Date(now.getTime() + 365 * 24 * 3600_000),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
        status: 'ACTIVE',
        activatedAt: now,
      },
    })
    const event = (start: Date) =>
      prisma.agendaEvent.create({
        data: {
          tenantId,
          responsibleId: sourceId,
          ownerUserId: sourceId,
          title: 'Visita',
          start: start,
          end: new Date(start.getTime() + 3600_000),
          participantName: 'Cliente',
          participantPhone: '1',
        },
      })
    futureEventId = (await event(new Date(now.getTime() + 24 * 3600_000))).id
    pastEventId = (await event(minutesAgo(24 * 60))).id
    await prisma.brokerGoal.create({
      data: {
        tenantId,
        userId: sourceId,
        monthlySales: 4,
        definedByName: 'Dona',
        createdAt: minutesAgo(600),
      },
    })
    await prisma.brokerGoal.create({
      data: {
        tenantId,
        userId: sourceId,
        monthlySales: 8,
        definedById: ownerId,
        definedByName: 'Dona',
      },
    })
  })

  afterAll(async () => {
    await prisma.contract.deleteMany({ where: { tenantId } })
    await prisma.lead.deleteMany({ where: { tenantId } })
    await prisma.opportunity.deleteMany({ where: { tenantId } })
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('lista só os corretores, com dados do perfil público', async () => {
    const members = await repository.listMembers(tenantId)

    expect(members.map((member) => member.name)).toEqual(['Marina', 'Thiago'])
    expect(members[0]).toMatchObject({
      headline: 'Especialista em Jardins',
      specialties: ['Alto padrão'],
      phone: '11999990000',
      hasPublicProfile: true,
      invitation: null,
    })
  })

  it('calcula imóveis ativos, leads em aberto, vendas, retornos, resposta e a meta vigente', async () => {
    const metrics = await repository.loadMetrics(tenantId, [sourceId, destinationId], period)

    expect(metrics.properties.get(sourceId)).toBe(1)
    expect(metrics.openLeads.get(sourceId)).toBe(1)
    expect(metrics.monthlySales.get(sourceId)).toBe(1)
    expect(metrics.returns.get(sourceId)).toBe(1)
    expect(metrics.responseMinutes.get(sourceId)?.map(Math.round).sort()).toEqual([20, 40])
    expect(metrics.goals.get(sourceId)).toMatchObject({ monthlySales: 8, setByName: 'Dona' })
    expect(metrics.properties.get(destinationId)).toBeUndefined()
  })

  it('a transferência manual leva só as oportunidades em aberto', async () => {
    const opportunity = (status: 'SENT' | 'REJECTED', archivedAt: Date | null = null) =>
      prisma.opportunity.create({
        data: {
          tenantId,
          propertyId: propertyId,
          responsibleId: sourceId,
          interestedName: 'Interessada',
          interestedEmail: `${randomUUID()}@team.example.test`,
          proposedValue: 1000,
          status,
          archivedAt,
        },
      })
    const open = await opportunity('SENT')
    const refused = await opportunity('REJECTED')
    const archived = await opportunity('SENT', now)

    const result = await repository.transfer({
      tenantId,
      sourceId,
      destinationId,
      items: { properties: false, leads: false, opportunities: true, futureEvents: false },
      opportunityScope: 'open',
      reason: 'MANUAL',
      actor: { id: ownerId, name: 'Dona' },
      now,
    })

    expect(result.opportunityIds).toEqual([open.id])
    const owners = await prisma.opportunity.findMany({
      where: { id: { in: [open.id, refused.id, archived.id] } },
      select: { id: true, responsibleId: true },
    })
    expect(Object.fromEntries(owners.map((row) => [row.id, row.responsibleId]))).toEqual({
      [open.id]: destinationId,
      [refused.id]: sourceId,
      [archived.id]: sourceId,
    })
    expect(
      (await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).responsibleId,
    ).toBe(sourceId)
    await prisma.portfolioTransfer.deleteMany({ where: { tenantId } })
  })

  it('desativa transferindo imóveis, leads e só os eventos futuros, com auditoria', async () => {
    const token = await prisma.refreshToken.create({
      data: {
        userId: sourceId,
        tenantId,
        tokenHash: randomUUID(),
        expiresAt: new Date(now.getTime() + 3600_000),
      },
    })

    const result = await repository.deactivateWithTransfer({
      tenantId,
      sourceId,
      destinationId,
      items: { properties: true, leads: true, opportunities: true, futureEvents: true },
      opportunityScope: 'all',
      reason: 'DEACTIVATION',
      actor: { id: ownerId, name: 'Dona' },
      now,
    })

    expect(result.propertyIds).toHaveLength(2)
    expect(result.leadIds).toHaveLength(2)
    expect(result.eventIds).toEqual([futureEventId])
    expect(result.opportunityIds.length).toBeGreaterThanOrEqual(2)
    expect(await prisma.opportunity.count({ where: { tenantId, responsibleId: sourceId } })).toBe(0)
    expect(
      (await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).responsibleId,
    ).toBe(destinationId)
    expect(
      await prisma.agendaEvent.findUniqueOrThrow({ where: { id: futureEventId } }),
    ).toMatchObject({ responsibleId: destinationId, ownerUserId: destinationId })
    expect(
      (await prisma.agendaEvent.findUniqueOrThrow({ where: { id: pastEventId } })).responsibleId,
    ).toBe(sourceId)
    expect(await prisma.user.findUniqueOrThrow({ where: { id: sourceId } })).toMatchObject({
      active: false,
    })
    expect(
      (await prisma.refreshToken.findUniqueOrThrow({ where: { id: token.id } })).revokedAt,
    ).not.toBeNull()
    const [transfer] = await prisma.portfolioTransfer.findMany({ where: { tenantId } })
    expect(transfer).toMatchObject({
      reason: 'DEACTIVATION',
      sourceName: 'Marina',
      targetName: 'Thiago',
      authorName: 'Dona',
      eventIds: [futureEventId],
    })
    expect(
      await prisma.userAuditEvent.count({
        where: { tenantId, userId: sourceId, action: 'DEACTIVATED', actorUserId: ownerId },
      }),
    ).toBe(1)
  })

  it('reativa e registra a mudança', async () => {
    expect(await repository.activate(tenantId, sourceId, ownerId)).toBe(true)
    expect(await repository.activate(tenantId, sourceId, ownerId)).toBe(false)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: sourceId } })).active).toBe(true)
  })

  it('convida, mostra o convite pendente e aceita uma única vez', async () => {
    const tokenHash = hashTeamInvitationToken(`token-${randomUUID()}`)
    const created = await invitations.create({
      tenantId,
      name: 'Bruna',
      email: `bruna-${randomUUID()}@team.example.test`,
      passwordHash: 'hash-inutil',
      tokenHash,
      expiresAt: new Date(now.getTime() + 7 * 24 * 3600_000),
      actor: { id: ownerId, name: 'Dona' },
    })
    const members = await repository.listMembers(tenantId)
    expect(members.find((member) => member.id === created.userId)?.invitation?.status).toBe(
      'PENDING',
    )
    expect(await prisma.user.findUniqueOrThrow({ where: { id: created.userId } })).toMatchObject({
      emailVerifiedAt: null,
      role: 'AGENT',
    })

    expect(await invitations.accept(tokenHash, 'hash-escolhido', new Date())).toBe(true)
    expect(await invitations.accept(tokenHash, 'outra', new Date())).toBe(false)
    const accepted = await prisma.user.findUniqueOrThrow({ where: { id: created.userId } })
    expect(accepted.passwordHash).toBe('hash-escolhido')
    expect(accepted.emailVerifiedAt).not.toBeNull()
    expect(
      (await repository.listMembers(tenantId)).find((member) => member.id === created.userId)
        ?.invitation,
    ).toBeNull()
  })

  it('não aceita convite expirado e cancela apagando o acesso pendente', async () => {
    const tokenHash = hashTeamInvitationToken(`token-${randomUUID()}`)
    const created = await invitations.create({
      tenantId,
      name: 'Caio',
      email: `caio-${randomUUID()}@team.example.test`,
      passwordHash: 'hash-inutil',
      tokenHash,
      expiresAt: minutesAgo(1),
      actor: { id: ownerId, name: 'Dona' },
    })

    expect(await invitations.accept(tokenHash, 'hash', new Date())).toBe(false)
    expect(await invitations.hasPortfolio(tenantId, created.userId)).toBe(false)
    expect(await invitations.deleteInvitedUser(tenantId, created.userId)).toBe(true)
    expect(await prisma.user.count({ where: { id: created.userId } })).toBe(0)
  })
})
