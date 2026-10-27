import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { getDatabaseUrl } from '../../src/server/db/database-url'
import type {
  FinancialEvidence,
  FinancialFixtureInput,
  FinancialFixtureResult,
} from '../types/financial-fixtures'
import { propertyResponsibleId } from '../../src/server/shared/tests/fixtures/property-responsible'

const slugPrefix = 'financial-e2e-'

function isolated() {
  if (
    process.env.KETRIS_E2E_ISOLATED_DB !== '1' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(getDatabaseUrl()).hostname)
  )
    throw new Error('Financial E2E exige banco local isolado.')
}

function daysFromToday(days: number) {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() + days)
  return date
}

export async function seedFinancialFixtures(
  prisma: PrismaClient,
  { suffix, password }: FinancialFixtureInput,
): Promise<FinancialFixtureResult> {
  isolated()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador inválido.')
  const tenant = await prisma.tenant.create({
    data: { nome: 'Financial E2E', slug: slugPrefix + suffix, accountType: 'AGENCY' },
  })
  const renters = await prisma.tenant.create({
    data: { nome: 'Locatários Financial E2E', slug: slugPrefix + 'renters-' + suffix },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const owner = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora Financial E2E',
      email: 'owner-' + suffix + '@financial.example.test',
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const renter = await prisma.usuario.create({
    data: {
      tenantId: renters.id,
      nome: 'Locatária Financial E2E',
      email: 'renter-' + suffix + '@financial.example.test',
      senhaHash,
      papel: 'RENTER',
      emailVerificadoEm: new Date(),
    },
  })
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: owner.id,
      titulo: 'Apartamento Financial E2E',
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      valor: 3200,
    },
  })
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      responsavelId: await propertyResponsibleId(prisma, property.id),
      interessadoNome: renter.nome,
      interessadoEmail: renter.email,
      valorProposto: 3200,
      status: 'ACEITA',
    },
  })
  const contract = await prisma.contrato.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      oportunidadeOrigemId: opportunity.id,
      codigo: 'FIN-E2E-001',
      valor: 3200,
      diaVencimento: 5,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2030-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
      status: 'ATIVO',
      partes: {
        create: {
          papel: 'LOCATARIO',
          nome: renter.nome,
          email: renter.email,
          cpf: '00000000000',
          usuarioId: renter.id,
        },
      },
    },
  })
  const year = new Date().getFullYear()
  const overdue = await prisma.cobranca.create({
    data: {
      tenantId: tenant.id,
      contratoId: contract.id,
      codigo: `COB-${year}-0001`,
      descricao: 'Aluguel atrasado E2E',
      tipo: 'A_RECEBER',
      valor: 3200,
      vencimento: daysFromToday(-10),
      status: 'PENDENTE',
      criadoPorId: owner.id,
    },
  })
  const scheduled = await prisma.cobranca.create({
    data: {
      tenantId: tenant.id,
      contratoId: contract.id,
      codigo: `COB-${year}-0002`,
      descricao: 'Aluguel futuro E2E',
      tipo: 'A_RECEBER',
      valor: 3200,
      vencimento: daysFromToday(20),
      status: 'AGENDADA',
      criadoPorId: owner.id,
    },
  })
  const payable = await prisma.cobranca.create({
    data: {
      tenantId: tenant.id,
      codigo: `COB-${year}-0003`,
      descricao: 'Manutenção a pagar E2E',
      tipo: 'A_PAGAR',
      valor: 450,
      vencimento: daysFromToday(5),
      status: 'PENDENTE',
      criadoPorId: owner.id,
    },
  })
  return {
    tenantIds: [tenant.id, renters.id],
    ownerEmail: owner.email,
    renterEmail: renter.email,
    overdueChargeId: overdue.id,
    overdueChargeCode: overdue.codigo,
    scheduledChargeCode: scheduled.codigo,
    payableChargeCode: payable.codigo,
    propertyTitle: property.titulo,
  }
}

export async function cleanupFinancialFixtures(prisma: PrismaClient, tenantIds: string[]) {
  isolated()
  const where = { tenantId: { in: tenantIds }, tenant: { slug: { startsWith: slugPrefix } } }
  await prisma.$transaction([
    prisma.chargeAuditEvent.deleteMany({ where }),
    prisma.cobranca.updateMany({ where, data: { comprovanteAtualId: null } }),
    prisma.comprovanteCobranca.deleteMany({ where }),
    prisma.cobranca.deleteMany({ where }),
    prisma.contrato.deleteMany({ where }),
    prisma.tenant.deleteMany({
      where: { id: { in: tenantIds }, slug: { startsWith: slugPrefix } },
    }),
  ])
  return null
}

export async function readFinancialEvidence(
  prisma: PrismaClient,
  chargeId: string,
): Promise<FinancialEvidence> {
  isolated()
  const charge = await prisma.cobranca.findFirstOrThrow({
    where: { id: chargeId, tenant: { slug: { startsWith: slugPrefix } } },
    include: { comprovantes: true },
  })
  const audit = await prisma.chargeAuditEvent.findMany({
    where: { chargeId },
    orderBy: { createdAt: 'asc' },
  })
  return {
    status: charge.status,
    paidById: charge.pagoPorId,
    cancellationReason: charge.motivoCancelamento,
    receiptCount: charge.comprovantes.length,
    auditActions: audit.map((event) => event.action),
  }
}
