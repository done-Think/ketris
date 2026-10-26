import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { protectLegacyContractCpfs } from '../../infrastructure/protect-legacy-contract-cpfs'
import { PrismaContractRepository } from '../../infrastructure/prisma-contract.repository'

let tenantId: string, contractId: string
const cpf = '529.982.247-25'

beforeAll(async () => {
  const tenant = await prisma.tenant.create({
    data: { nome: 'Proteção Contracts teste', slug: `contracts-cpf-${randomUUID()}` },
  })
  tenantId = tenant.id
  const user = await prisma.usuario.create({
    data: {
      tenantId,
      nome: 'Gestora',
      email: `${randomUUID()}@example.test`,
      senhaHash: 'test-only',
      papel: 'OWNER',
    },
  })
  const property = await prisma.imovel.create({
    data: {
      tenantId,
      responsavelId: user.id,
      titulo: 'Imóvel',
      tipo: 'CASA',
      finalidade: 'ALUGUEL',
      valor: 1000,
    },
  })
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId,
      imovelId: property.id,
      interessadoNome: 'Pessoa',
      interessadoEmail: 'person@example.test',
      status: 'ACEITA',
      valorProposto: 1000,
    },
  })
  const contract = await prisma.contrato.create({
    data: {
      tenantId,
      imovelId: property.id,
      oportunidadeOrigemId: opportunity.id,
      codigo: `CPF-${randomUUID()}`,
      valor: 1000,
      diaVencimento: 5,
      dataInicio: new Date('2031-01-01'),
      dataFim: new Date('2032-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
      partes: {
        create: [
          { papel: 'LOCADOR', nome: 'Pessoa A', email: 'owner@example.test', cpf },
          { papel: 'LOCATARIO', nome: 'Pessoa B', email: 'renter@example.test', cpf },
        ],
      },
    },
  })
  contractId = contract.id
})

afterAll(async () => {
  vi.unstubAllEnvs()
  if (contractId) await prisma.contrato.delete({ where: { id: contractId } })
  if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
})

it('recusa chave inválida antes de alterar qualquer CPF ou histórico', async () => {
  vi.stubEnv('CONTRACTS_DATA_ENCRYPTION_KEY', 'invalid')
  try {
    await expect(protectLegacyContractCpfs(prisma, { tenantId })).rejects.toMatchObject({
      code: 'CONTRACT_DATA_PROTECTION_UNAVAILABLE',
    })
    const parties = await prisma.parteContrato.findMany({ where: { contratoId: contractId } })
    expect(parties.every((party) => party.cpf === cpf)).toBe(true)
    expect(await prisma.contractAuditEvent.count({ where: { contractId } })).toBe(0)
  } finally {
    vi.unstubAllEnvs()
  }
})

it('protege os legados de forma idempotente, preserva leitura e registra somente manutenção do sistema', async () => {
  expect(await protectLegacyContractCpfs(prisma, { tenantId })).toBe(2)
  expect(await protectLegacyContractCpfs(prisma, { tenantId })).toBe(0)
  const parties = await prisma.parteContrato.findMany({ where: { contratoId: contractId } })
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
