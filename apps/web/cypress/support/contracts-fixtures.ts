import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getDatabaseUrl } from '../../src/server/db/database-url'
import type {
  ContractEvidenceResult,
  ContractFixtureSeedInput,
  ContractFixtureSeedResult,
} from '../types/contracts-fixtures'
import { propertyResponsibleId } from '../../src/server/shared/tests/fixtures/property-responsible'

function assertIsolatedContractDatabase() {
  const url = new URL(getDatabaseUrl())
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    process.env.KETRIS_E2E_ISOLATED_DB !== '1'
  )
    throw new Error('Fixtures de Contracts exigem banco local isolado.')
}

export async function seedContractFixtures(
  prisma: PrismaClient,
  { suffix, password }: ContractFixtureSeedInput,
): Promise<ContractFixtureSeedResult> {
  assertIsolatedContractDatabase()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador de fixture inválido.')
  const tenant = await prisma.tenant.create({
    data: { name: 'Contracts E2E', slug: 'contracts-e2e-' + suffix, accountType: 'AGENCY' },
  })
  const renters = await prisma.tenant.create({
    data: { name: 'Locatários Contracts E2E', slug: 'contracts-e2e-renters-' + suffix },
  })
  const passwordHash = await bcrypt.hash(password, 10)
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora Contracts E2E',
      email: 'owner-' + suffix + '@contracts.example.test',
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const propertyOwner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Proprietária Contracts E2E',
      email: 'property-owner-' + suffix + '@contracts.example.test',
      phone: '11988888888',
      passwordHash,
      role: 'PROPERTY_OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const renter = await prisma.user.create({
    data: {
      tenantId: renters.id,
      name: 'Locatária Contracts E2E',
      email: 'renter-' + suffix + '@contracts.example.test',
      phone: '11999999999',
      passwordHash,
      role: 'RENTER',
      emailVerifiedAt: new Date(),
    },
  })
  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: owner.id,
      ownerId: propertyOwner.id,
      title: 'Apartamento Contracts E2E',
      type: 'APARTMENT',
      purpose: 'RENT',
      price: 2450.75,
      status: 'PUBLISHED',
    },
  })
  await prisma.opportunity.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      responsibleId: await propertyResponsibleId(prisma, property.id),
      interestedName: renter.name,
      interestedEmail: renter.email,
      interestedPhone: renter.phone,
      proposedValue: 2450.75,
      status: 'ACCEPTED',
    },
  })
  for (let index = 0; index < 26; index++) {
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        responsibleId: await propertyResponsibleId(prisma, property.id),
        interestedName: 'Histórico ' + index,
        interestedEmail: 'history-' + index + '@example.test',
        proposedValue: 1000 + index,
        status: 'ACCEPTED',
      },
    })
    await prisma.contract.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        sourceOpportunityId: opportunity.id,
        code: 'LEG-' + String(index).padStart(3, '0'),
        amount: 1000 + index,
        dueDay: 5,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2021-01-01'),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
        status: 'CLOSED',
      },
    })
  }
  return {
    tenantIds: [tenant.id, renters.id],
    ownerEmail: owner.email,
    ownerId: owner.id,
    ownerName: propertyOwner.name,
    renterEmail: renter.email,
    leadName: renter.name,
    propertyId: property.id,
    propertyTitle: property.title,
  }
}

export async function cleanupContractFixtures(prisma: PrismaClient, tenantIds: string[]) {
  assertIsolatedContractDatabase()
  if (tenantIds.length) {
    await prisma.charge.deleteMany({
      where: { tenantId: { in: tenantIds }, tenant: { slug: { startsWith: 'contracts-e2e-' } } },
    })
    await prisma.contractSignature.deleteMany({
      where: {
        contractParty: {
          contract: {
            tenantId: { in: tenantIds },
            tenant: { slug: { startsWith: 'contracts-e2e-' } },
          },
        },
      },
    })
    await prisma.contract.deleteMany({
      where: { tenantId: { in: tenantIds }, tenant: { slug: { startsWith: 'contracts-e2e-' } } },
    })
    await prisma.tenant.deleteMany({
      where: { id: { in: tenantIds }, slug: { startsWith: 'contracts-e2e-' } },
    })
  }
  return null
}

export async function readContractEvidence(
  prisma: PrismaClient,
  contractId: string,
): Promise<ContractEvidenceResult> {
  assertIsolatedContractDatabase()
  const contract = await prisma.contract.findFirstOrThrow({
    where: { id: contractId, tenant: { slug: { startsWith: 'contracts-e2e-' } } },
    include: {
      property: { select: { status: true } },
      parties: { include: { signature: true } },
      _count: { select: { charges: true } },
    },
  })
  const audits = await prisma.contractAuditEvent.findMany({ where: { contractId } })
  return {
    status: contract.status,
    propertyStatus: contract.property.status,
    chargeCount: contract._count.charges,
    protectedCpfs: contract.parties.every((party) => party.cpf.startsWith('enc:v1:')),
    signatures: contract.parties.map((party) => ({
      method: party.signature?.method ?? null,
      hash: party.signature?.documentSha256 ?? null,
      author: party.signature?.signedById ?? null,
    })),
    actions: audits.map((audit) => audit.action),
  }
}
