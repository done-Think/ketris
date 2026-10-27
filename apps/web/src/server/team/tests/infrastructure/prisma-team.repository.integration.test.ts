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

  async function user(name: string, papel: 'OWNER' | 'AGENT') {
    return prisma.usuario.create({
      data: {
        tenantId,
        nome: name,
        email: `${name.toLowerCase()}-${randomUUID()}@team.example.test`,
        senhaHash: 'hash-fake',
        papel,
      },
    })
  }

  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({ data: { nome: 'Equipe', slug: `team-${randomUUID()}` } })
    ).id
    ownerId = (await user('Dona', 'OWNER')).id
    sourceId = (await user('Marina', 'AGENT')).id
    destinationId = (await user('Thiago', 'AGENT')).id
    await prisma.perfilPublicoCorretor.create({
      data: {
        usuarioId: sourceId,
        displayName: 'Marina',
        headline: 'Especialista em Jardins',
        especialidades: ['Alto padrão'],
        telefone: '11999990000',
        status: 'PUBLISHED',
        publicadoEm: now,
      },
    })
    const property = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: sourceId,
        titulo: 'Casa da equipe',
        finalidade: 'VENDA',
        tipo: 'CASA',
        valor: 500000,
        status: 'PUBLISHED',
      },
    })
    propertyId = property.id
    await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: sourceId,
        titulo: 'Inativo',
        finalidade: 'VENDA',
        tipo: 'CASA',
        valor: 1,
        status: 'INACTIVE',
      },
    })
    await prisma.lead.create({
      data: {
        tenantId,
        responsavelId: sourceId,
        nome: 'Lead aberto',
        telefone: '1',
        interesse: 'Compra',
        orcamento: '1',
        origem: 'SITE',
        createdAt: minutesAgo(120),
        primeiroContatoEm: minutesAgo(100),
      },
    })
    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: property.id,
        responsavelId: await propertyResponsibleId(prisma, property.id),
        interessadoNome: 'Comprador',
        interessadoEmail: 'comprador@example.test',
        valorProposto: 480000,
        status: 'ACEITA',
        createdAt: minutesAgo(60),
      },
    })
    await prisma.lead.create({
      data: {
        tenantId,
        responsavelId: sourceId,
        nome: 'Lead convertido',
        telefone: '1',
        interesse: 'Compra',
        orcamento: '1',
        origem: 'SITE',
        oportunidadeId: opportunity.id,
      },
    })
    await prisma.atividadeOportunidade.createMany({
      data: [
        {
          oportunidadeId: opportunity.id,
          tipo: 'CONTATO_REALIZADO',
          descricao: '',
          autorId: sourceId,
          createdAt: minutesAgo(20),
        },
        {
          oportunidadeId: opportunity.id,
          tipo: 'NOTA',
          descricao: '',
          autorId: sourceId,
          createdAt: minutesAgo(10),
        },
      ],
    })
    await prisma.contrato.create({
      data: {
        tenantId,
        imovelId: property.id,
        oportunidadeOrigemId: opportunity.id,
        codigo: `TEAM-${randomUUID()}`,
        valor: 480000,
        diaVencimento: 5,
        dataInicio: now,
        dataFim: new Date(now.getTime() + 365 * 24 * 3600_000),
        indiceReajuste: 'IPCA',
        tipoGarantia: 'CAUCAO',
        status: 'ATIVO',
        ativadoEm: now,
      },
    })
    const event = (start: Date) =>
      prisma.eventoAgenda.create({
        data: {
          tenantId,
          responsavelId: sourceId,
          donoUsuarioId: sourceId,
          titulo: 'Visita',
          inicio: start,
          fim: new Date(start.getTime() + 3600_000),
          participanteNome: 'Cliente',
          participanteTelefone: '1',
        },
      })
    futureEventId = (await event(new Date(now.getTime() + 24 * 3600_000))).id
    pastEventId = (await event(minutesAgo(24 * 60))).id
    await prisma.metaCorretor.create({
      data: {
        tenantId,
        usuarioId: sourceId,
        vendasMensais: 4,
        definidoPorNome: 'Dona',
        createdAt: minutesAgo(600),
      },
    })
    await prisma.metaCorretor.create({
      data: {
        tenantId,
        usuarioId: sourceId,
        vendasMensais: 8,
        definidoPorId: ownerId,
        definidoPorNome: 'Dona',
      },
    })
  })

  afterAll(async () => {
    await prisma.contrato.deleteMany({ where: { tenantId } })
    await prisma.lead.deleteMany({ where: { tenantId } })
    await prisma.oportunidade.deleteMany({ where: { tenantId } })
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
    const opportunity = (status: 'ENVIADA' | 'RECUSADA', arquivadaEm: Date | null = null) =>
      prisma.oportunidade.create({
        data: {
          tenantId,
          imovelId: propertyId,
          responsavelId: sourceId,
          interessadoNome: 'Interessada',
          interessadoEmail: `${randomUUID()}@team.example.test`,
          valorProposto: 1000,
          status,
          arquivadaEm,
        },
      })
    const open = await opportunity('ENVIADA')
    const refused = await opportunity('RECUSADA')
    const archived = await opportunity('ENVIADA', now)

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
    const owners = await prisma.oportunidade.findMany({
      where: { id: { in: [open.id, refused.id, archived.id] } },
      select: { id: true, responsavelId: true },
    })
    expect(Object.fromEntries(owners.map((row) => [row.id, row.responsavelId]))).toEqual({
      [open.id]: destinationId,
      [refused.id]: sourceId,
      [archived.id]: sourceId,
    })
    expect(
      (await prisma.imovel.findUniqueOrThrow({ where: { id: propertyId } })).responsavelId,
    ).toBe(sourceId)
    await prisma.transferenciaCarteira.deleteMany({ where: { tenantId } })
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
      reason: 'DESATIVACAO',
      actor: { id: ownerId, name: 'Dona' },
      now,
    })

    expect(result.propertyIds).toHaveLength(2)
    expect(result.leadIds).toHaveLength(2)
    expect(result.eventIds).toEqual([futureEventId])
    expect(result.opportunityIds.length).toBeGreaterThanOrEqual(2)
    expect(await prisma.oportunidade.count({ where: { tenantId, responsavelId: sourceId } })).toBe(
      0,
    )
    expect(
      (await prisma.imovel.findUniqueOrThrow({ where: { id: propertyId } })).responsavelId,
    ).toBe(destinationId)
    expect(
      await prisma.eventoAgenda.findUniqueOrThrow({ where: { id: futureEventId } }),
    ).toMatchObject({ responsavelId: destinationId, donoUsuarioId: destinationId })
    expect(
      (await prisma.eventoAgenda.findUniqueOrThrow({ where: { id: pastEventId } })).responsavelId,
    ).toBe(sourceId)
    expect(await prisma.usuario.findUniqueOrThrow({ where: { id: sourceId } })).toMatchObject({
      ativo: false,
    })
    expect(
      (await prisma.refreshToken.findUniqueOrThrow({ where: { id: token.id } })).revokedAt,
    ).not.toBeNull()
    const [transfer] = await prisma.transferenciaCarteira.findMany({ where: { tenantId } })
    expect(transfer).toMatchObject({
      motivo: 'DESATIVACAO',
      origemNome: 'Marina',
      destinoNome: 'Thiago',
      autorNome: 'Dona',
      eventoIds: [futureEventId],
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
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: sourceId } })).ativo).toBe(true)
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
    expect(await prisma.usuario.findUniqueOrThrow({ where: { id: created.userId } })).toMatchObject(
      { emailVerificadoEm: null, papel: 'AGENT' },
    )

    expect(await invitations.accept(tokenHash, 'hash-escolhido', new Date())).toBe(true)
    expect(await invitations.accept(tokenHash, 'outra', new Date())).toBe(false)
    const accepted = await prisma.usuario.findUniqueOrThrow({ where: { id: created.userId } })
    expect(accepted.senhaHash).toBe('hash-escolhido')
    expect(accepted.emailVerificadoEm).not.toBeNull()
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
    expect(await prisma.usuario.count({ where: { id: created.userId } })).toBe(0)
  })
})
