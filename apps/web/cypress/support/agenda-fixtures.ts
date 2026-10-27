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
    data: { nome: 'Agenda E2E', slug: `agenda-e2e-agency-${suffix}`, accountType: 'AGENCY' },
  })
  const foreign = await prisma.tenant.create({
    data: {
      nome: 'Outra imobiliária E2E',
      slug: `agenda-e2e-other-${suffix}`,
      accountType: 'AGENCY',
    },
  })
  const renters = await prisma.tenant.create({
    data: {
      nome: 'Locatários E2E',
      slug: `agenda-e2e-renters-${suffix}`,
      accountType: 'INDIVIDUAL',
    },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const owner = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora Agenda E2E',
      email: `owner-${suffix}@agenda.example.test`,
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const agent = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Corretora Agenda E2E',
      email: `agent-${suffix}@agenda.example.test`,
      senhaHash,
      papel: 'AGENT',
      emailVerificadoEm: new Date(),
      vinculoAprovadoEm: new Date(),
    },
  })
  const renter = await prisma.usuario.create({
    data: {
      tenantId: renters.id,
      nome: 'Locatária Agenda E2E',
      email: `renter-${suffix}@agenda.example.test`,
      senhaHash,
      papel: 'RENTER',
      emailVerificadoEm: new Date(),
    },
  })
  const outsider = await prisma.usuario.create({
    data: {
      tenantId: foreign.id,
      nome: 'Outra gestão',
      email: `foreign-${suffix}@agenda.example.test`,
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  let propertyId = ''
  for (let index = 0; index < 26; index++) {
    const property = await prisma.imovel.create({
      data: {
        tenantId: tenant.id,
        responsavelId: agent.id,
        titulo: `Imóvel E2E ${String(index).padStart(2, '0')}`,
        finalidade: 'ALUGUEL',
        tipo: 'APARTAMENTO',
        valor: 1000,
      },
    })
    if (index === 0) propertyId = property.id
  }
  const privateProperty = await prisma.imovel.create({
    data: {
      tenantId: foreign.id,
      responsavelId: outsider.id,
      titulo: 'Privado de outra imobiliária',
      finalidade: 'VENDA',
      tipo: 'APARTAMENTO',
      valor: 100000,
    },
  })
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId: tenant.id,
      imovelId: propertyId,
      responsavelId: await propertyResponsibleId(prisma, propertyId),
      interessadoNome: renter.nome,
      interessadoEmail: renter.email,
      valorProposto: 1000,
      status: 'ACEITA',
    },
  })
  await prisma.contrato.create({
    data: {
      tenantId: tenant.id,
      imovelId: propertyId,
      oportunidadeOrigemId: opportunity.id,
      codigo: `AGENDA-E2E-${suffix}`,
      valor: 1000,
      diaVencimento: 5,
      dataInicio: new Date('2020-01-01'),
      dataFim: new Date('2035-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
      status: 'ATIVO',
      ativadoEm: new Date(),
      ativadoPorId: owner.id,
      partes: {
        create: {
          usuarioId: renter.id,
          papel: 'LOCATARIO',
          nome: renter.nome,
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
    ownerName: owner.nome,
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
