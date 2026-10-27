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
    data: { nome: 'Imobiliária Equipe E2E', slug: slugPrefix + suffix, accountType: 'AGENCY' },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const ownerEmail = 'owner-' + suffix + '@team.example.test'
  await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora Equipe',
      email: ownerEmail,
      senhaHash,
      papel: 'OWNER',
    },
  })
  const sourceName = 'Ana Origem ' + suffix
  const destinationName = 'Bruno Destino ' + suffix
  const source = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: sourceName,
      email: 'ana-' + suffix + '@team.example.test',
      telefone: '(41) 99999-1111',
      senhaHash,
      papel: 'AGENT',
    },
  })
  await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: destinationName,
      email: 'bruno-' + suffix + '@team.example.test',
      senhaHash,
      papel: 'AGENT',
    },
  })
  for (const index of [1, 2, 3]) {
    await prisma.imovel.create({
      data: {
        tenantId: tenant.id,
        responsavelId: source.id,
        titulo: 'Imóvel Equipe ' + index + ' ' + suffix,
        descricao: 'Imóvel da carteira da corretora de origem.',
        finalidade: 'VENDA',
        tipo: 'APARTAMENTO',
        quartos: 2,
        banheiros: 1,
        vagas: 1,
        areaM2: 70,
        valor: 400000 + index,
        status: 'PUBLISHED',
      },
    })
  }
  const property = await prisma.imovel.findFirstOrThrow({
    where: { tenantId: tenant.id, responsavelId: source.id },
  })
  await prisma.oportunidade.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      responsavelId: source.id,
      interessadoNome: 'Interessada Equipe',
      interessadoEmail: 'interessada-' + suffix + '@team.example.test',
      valorProposto: 390000,
      status: 'ENVIADA',
    },
  })
  const contactedAt = new Date()
  for (const index of [1, 2]) {
    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        responsavelId: source.id,
        nome: 'Lead Equipe ' + index,
        telefone: '41999990000',
        interesse: 'Apartamento',
        orcamento: 'A combinar',
        origem: 'SITE',
        estagio: index === 1 ? 'NOVO' : 'EM_CONTATO',
        primeiroContatoEm: index === 1 ? null : contactedAt,
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
    prisma.oportunidade.deleteMany({ where }),
    prisma.lead.deleteMany({ where }),
    prisma.imovel.deleteMany({ where }),
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
    prisma.usuario.findFirstOrThrow({
      where: { tenantId: input.tenantId, nome: input.sourceName },
    }),
    prisma.usuario.findFirstOrThrow({
      where: { tenantId: input.tenantId, nome: input.destinationName },
    }),
    prisma.usuario.findFirst({
      where: { tenantId: input.tenantId, email: input.invitedEmail },
      include: { conviteEquipe: true },
    }),
  ])
  const count = (model: 'imovel' | 'lead' | 'oportunidade', responsavelId: string) =>
    model === 'imovel'
      ? prisma.imovel.count({ where: { tenantId: input.tenantId, responsavelId } })
      : model === 'lead'
        ? prisma.lead.count({ where: { tenantId: input.tenantId, responsavelId } })
        : prisma.oportunidade.count({ where: { tenantId: input.tenantId, responsavelId } })
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
    count('imovel', source.id),
    count('lead', source.id),
    count('imovel', destination.id),
    count('lead', destination.id),
    count('oportunidade', source.id),
    count('oportunidade', destination.id),
    prisma.metaCorretor.findFirst({
      where: { tenantId: input.tenantId, usuarioId: source.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transferenciaCarteira.count({ where: { tenantId: input.tenantId } }),
  ])

  return {
    sourceActive: source.ativo,
    sourceProperties,
    sourceLeads,
    destinationProperties,
    destinationLeads,
    sourceOpportunities,
    destinationOpportunities,
    goal: goal?.vendasMensais ?? null,
    transfers,
    invitedActive: invited ? invited.ativo : null,
    invitationAccepted: Boolean(invited?.conviteEquipe?.aceitoEm),
  }
}
