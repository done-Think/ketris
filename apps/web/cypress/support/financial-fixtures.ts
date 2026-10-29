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
    data: { name: 'Financial E2E', slug: slugPrefix + suffix, accountType: 'AGENCY' },
  })
  const renters = await prisma.tenant.create({
    data: { name: 'Locatários Financial E2E', slug: slugPrefix + 'renters-' + suffix },
  })
  const passwordHash = await bcrypt.hash(password, 10)
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora Financial E2E',
      email: 'owner-' + suffix + '@financial.example.test',
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const renter = await prisma.user.create({
    data: {
      tenantId: renters.id,
      name: 'Locatária Financial E2E',
      email: 'renter-' + suffix + '@financial.example.test',
      passwordHash,
      role: 'RENTER',
      emailVerifiedAt: new Date(),
    },
  })
  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: owner.id,
      title: 'Apartamento Financial E2E',
      purpose: 'RENT',
      type: 'APARTMENT',
      price: 3200,
    },
  })
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      responsibleId: await propertyResponsibleId(prisma, property.id),
      interestedName: renter.name,
      interestedEmail: renter.email,
      proposedValue: 3200,
      status: 'ACCEPTED',
    },
  })
  const contract = await prisma.contract.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      sourceOpportunityId: opportunity.id,
      code: 'FIN-E2E-001',
      amount: 3200,
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
  const year = new Date().getFullYear()
  const overdue = await prisma.charge.create({
    data: {
      tenantId: tenant.id,
      contractId: contract.id,
      code: `COB-${year}-0001`,
      description: 'Aluguel atrasado E2E',
      type: 'RECEIVABLE',
      amount: 3200,
      dueDate: daysFromToday(-10),
      status: 'PENDING',
      createdById: owner.id,
    },
  })
  const scheduled = await prisma.charge.create({
    data: {
      tenantId: tenant.id,
      contractId: contract.id,
      code: `COB-${year}-0002`,
      description: 'Aluguel futuro E2E',
      type: 'RECEIVABLE',
      amount: 3200,
      dueDate: daysFromToday(20),
      status: 'SCHEDULED',
      createdById: owner.id,
    },
  })
  const payable = await prisma.charge.create({
    data: {
      tenantId: tenant.id,
      code: `COB-${year}-0003`,
      description: 'Manutenção a pagar E2E',
      type: 'PAYABLE',
      amount: 450,
      dueDate: daysFromToday(5),
      status: 'PENDING',
      createdById: owner.id,
    },
  })
  return {
    tenantIds: [tenant.id, renters.id],
    ownerEmail: owner.email,
    renterEmail: renter.email,
    overdueChargeId: overdue.id,
    overdueChargeCode: overdue.code,
    scheduledChargeCode: scheduled.code,
    payableChargeCode: payable.code,
    propertyTitle: property.title,
  }
}

export async function cleanupFinancialFixtures(prisma: PrismaClient, tenantIds: string[]) {
  isolated()
  const where = { tenantId: { in: tenantIds }, tenant: { slug: { startsWith: slugPrefix } } }
  await prisma.$transaction([
    prisma.chargeAuditEvent.deleteMany({ where }),
    prisma.charge.updateMany({ where, data: { currentReceiptId: null } }),
    prisma.chargeReceipt.deleteMany({ where }),
    prisma.charge.deleteMany({ where }),
    prisma.contract.deleteMany({ where }),
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
  const charge = await prisma.charge.findFirstOrThrow({
    where: { id: chargeId, tenant: { slug: { startsWith: slugPrefix } } },
    include: { receipts: true },
  })
  const audit = await prisma.chargeAuditEvent.findMany({
    where: { chargeId },
    orderBy: { createdAt: 'asc' },
  })
  return {
    status: charge.status,
    paidById: charge.paidById,
    cancellationReason: charge.cancellationReason,
    receiptCount: charge.receipts.length,
    auditActions: audit.map((event) => event.action),
  }
}
