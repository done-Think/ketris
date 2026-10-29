import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { protectLegacyContractCpfs } from '../../infrastructure/protect-legacy-contract-cpfs'
import { PrismaContractRepository } from '../../infrastructure/prisma-contract.repository'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

let tenantId: string, contractId: string
const cpf = '529.982.247-25'

beforeAll(async () => {
  const tenant = await prisma.tenant.create({
    data: { name: 'Proteção Contracts teste', slug: `contracts-cpf-${randomUUID()}` },
  })
  tenantId = tenant.id
  const user = await prisma.user.create({
    data: {
      tenantId,
      name: 'Gestora',
      email: `${randomUUID()}@example.test`,
      passwordHash: 'test-only',
      role: 'OWNER',
    },
  })
  const property = await prisma.property.create({
    data: {
      tenantId,
      responsibleId: user.id,
      title: 'Imóvel',
      type: 'HOUSE',
      purpose: 'RENT',
      price: 1000,
    },
  })
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId,
      propertyId: property.id,
      responsibleId: await propertyResponsibleId(prisma, property.id),
      interestedName: 'Pessoa',
      interestedEmail: 'person@example.test',
      status: 'ACCEPTED',
      proposedValue: 1000,
    },
  })
  const contract = await prisma.contract.create({
    data: {
      tenantId,
      propertyId: property.id,
      sourceOpportunityId: opportunity.id,
      code: `CPF-${randomUUID()}`,
      amount: 1000,
      dueDay: 5,
      startDate: new Date('2031-01-01'),
      endDate: new Date('2032-01-01'),
      adjustmentIndex: 'IPCA',
      guaranteeType: 'DEPOSIT',
      parties: {
        create: [
          { role: 'LANDLORD', name: 'Pessoa A', email: 'owner@example.test', cpf },
          { role: 'RENTER', name: 'Pessoa B', email: 'renter@example.test', cpf },
        ],
      },
    },
  })
  contractId = contract.id
})

afterAll(async () => {
  vi.unstubAllEnvs()
  if (contractId) await prisma.contract.delete({ where: { id: contractId } })
  if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
})

it('recusa chave inválida antes de alterar qualquer CPF ou histórico', async () => {
  vi.stubEnv('CONTRACTS_DATA_ENCRYPTION_KEY', 'invalid')
  try {
    await expect(protectLegacyContractCpfs(prisma, { tenantId })).rejects.toMatchObject({
      code: 'CONTRACT_DATA_PROTECTION_UNAVAILABLE',
    })
    const parties = await prisma.contractParty.findMany({ where: { contractId: contractId } })
    expect(parties.every((party) => party.cpf === cpf)).toBe(true)
    expect(await prisma.contractAuditEvent.count({ where: { contractId } })).toBe(0)
  } finally {
    vi.unstubAllEnvs()
  }
})

it('protege os legados de forma idempotente, preserva leitura e registra somente manutenção do sistema', async () => {
  expect(await protectLegacyContractCpfs(prisma, { tenantId })).toBe(2)
  expect(await protectLegacyContractCpfs(prisma, { tenantId })).toBe(0)
  const parties = await prisma.contractParty.findMany({ where: { contractId: contractId } })
  expect(parties.every((party) => party.cpf.startsWith('enc:v1:'))).toBe(true)
  expect(parties.every((party) => !party.cpf.includes(cpf))).toBe(true)
  const result = await new PrismaContractRepository().findById(contractId, {
    kind: 'tenant',
    tenantId,
  })
  expect(result?.parties.every((party) => party.cpf === cpf)).toBe(true)
  const events = await prisma.contractAuditEvent.findMany({ where: { contractId } })
  expect(events).toHaveLength(2)
  for (const event of events) {
    expect(event).toMatchObject({
      actorType: 'SYSTEM',
      actorUserId: null,
      changedFields: ['parties.cpfProtection'],
    })
    expect(JSON.stringify(event)).not.toContain(cpf)
  }
})
