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
    data: { nome: 'Contracts E2E', slug: 'contracts-e2e-' + suffix, accountType: 'AGENCY' },
  })
  const renters = await prisma.tenant.create({
    data: { nome: 'Locatários Contracts E2E', slug: 'contracts-e2e-renters-' + suffix },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const owner = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora Contracts E2E',
      email: 'owner-' + suffix + '@contracts.example.test',
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const propertyOwner = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Proprietária Contracts E2E',
      email: 'property-owner-' + suffix + '@contracts.example.test',
      telefone: '11988888888',
      senhaHash,
      papel: 'PROPERTY_OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const renter = await prisma.usuario.create({
    data: {
      tenantId: renters.id,
      nome: 'Locatária Contracts E2E',
      email: 'renter-' + suffix + '@contracts.example.test',
      telefone: '11999999999',
      senhaHash,
      papel: 'RENTER',
      emailVerificadoEm: new Date(),
    },
  })
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: owner.id,
      proprietarioId: propertyOwner.id,
      titulo: 'Apartamento Contracts E2E',
      tipo: 'APARTAMENTO',
      finalidade: 'ALUGUEL',
      valor: 2450.75,
      status: 'PUBLISHED',
    },
  })
  await prisma.oportunidade.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      responsavelId: await propertyResponsibleId(prisma, property.id),
      interessadoNome: renter.nome,
      interessadoEmail: renter.email,
      interessadoTelefone: renter.telefone,
      valorProposto: 2450.75,
      status: 'ACEITA',
    },
  })
  for (let index = 0; index < 26; index++) {
    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId: tenant.id,
        imovelId: property.id,
        responsavelId: await propertyResponsibleId(prisma, property.id),
        interessadoNome: 'Histórico ' + index,
        interessadoEmail: 'history-' + index + '@example.test',
        valorProposto: 1000 + index,
        status: 'ACEITA',
      },
    })
    await prisma.contrato.create({
      data: {
        tenantId: tenant.id,
        imovelId: property.id,
        oportunidadeOrigemId: opportunity.id,
        codigo: 'LEG-' + String(index).padStart(3, '0'),
        valor: 1000 + index,
        diaVencimento: 5,
        dataInicio: new Date('2020-01-01'),
        dataFim: new Date('2021-01-01'),
        indiceReajuste: 'IPCA',
        tipoGarantia: 'CAUCAO',
        status: 'ENCERRADO',
      },
    })
  }
  return {
    tenantIds: [tenant.id, renters.id],
    ownerEmail: owner.email,
    ownerId: owner.id,
    ownerName: propertyOwner.nome,
    renterEmail: renter.email,
    leadName: renter.nome,
    propertyId: property.id,
    propertyTitle: property.titulo,
  }
}

export async function cleanupContractFixtures(prisma: PrismaClient, tenantIds: string[]) {
  assertIsolatedContractDatabase()
  if (tenantIds.length) {
    await prisma.cobranca.deleteMany({
      where: { tenantId: { in: tenantIds }, tenant: { slug: { startsWith: 'contracts-e2e-' } } },
    })
    await prisma.contrato.deleteMany({
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
  const contract = await prisma.contrato.findFirstOrThrow({
    where: { id: contractId, tenant: { slug: { startsWith: 'contracts-e2e-' } } },
    include: {
      imovel: { select: { status: true } },
      partes: { include: { assinatura: true } },
      _count: { select: { cobrancas: true } },
    },
  })
  const audits = await prisma.contractAuditEvent.findMany({ where: { contractId } })
  return {
    status: contract.status,
    propertyStatus: contract.imovel.status,
    chargeCount: contract._count.cobrancas,
    protectedCpfs: contract.partes.every((party) => party.cpf.startsWith('enc:v1:')),
    signatures: contract.partes.map((party) => ({
      method: party.assinatura?.metodo ?? null,
      hash: party.assinatura?.sha256Documento ?? null,
      author: party.assinatura?.assinadaPorId ?? null,
    })),
    actions: audits.map((audit) => audit.action),
  }
}
