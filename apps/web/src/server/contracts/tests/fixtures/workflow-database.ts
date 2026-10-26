import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { POST as createContract } from '@/app/api/contracts/route'

export function contractRequest(token: string, path: string, method = 'GET', body?: unknown) {
  return new NextRequest('http://localhost/api/contracts' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      'content-type': 'application/json',
      'user-agent': 'Contracts integration',
      'x-forwarded-for': '198.51.100.99',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

export async function createContractWorkflowFixture() {
  const tenant = await prisma.tenant.create({
    data: { nome: 'Contracts workflow', slug: 'contracts-workflow-' + randomUUID() },
  })
  const actor = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora',
      email: randomUUID() + '@example.test',
      senhaHash: 'test-only',
      papel: 'OWNER',
    },
  })
  const agent = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Outro corretor',
      email: randomUUID() + '@example.test',
      senhaHash: 'test-only',
      papel: 'AGENT',
    },
  })
  const renter = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Locatário',
      email: randomUUID() + '@example.test',
      senhaHash: 'test-only',
      papel: 'RENTER',
    },
  })
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: actor.id,
      titulo: 'Apartamento workflow',
      tipo: 'APARTAMENTO',
      finalidade: 'ALUGUEL',
      valor: 2000,
      status: 'PUBLISHED',
      publicadoEm: new Date('2020-01-01'),
    },
  })
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      interessadoNome: renter.nome,
      interessadoEmail: renter.email,
      status: 'ACEITA',
      valorProposto: 2000,
    },
  })
  const tokens = new JoseTokenService()
  const ownerToken = await tokens.sign(actor)
  const agentToken = await tokens.sign(agent)
  const renterToken = await tokens.sign(renter)
  const body = {
    opportunityId: opportunity.id,
    type: 'RESIDENCIAL',
    amount: 1750.75,
    dueDay: 5,
    startDate: '2031-01-01',
    endDate: '2032-01-01',
    adjustmentIndex: 'IPCA',
    guaranteeType: 'CAUCAO',
    notes: null,
    owner: {
      name: 'Proprietária',
      cpf: '52998224725',
      email: 'owner@example.test',
      phone: '11999999999',
    },
    tenant: { name: renter.nome, cpf: '98765432100', email: renter.email, phone: '11999999999' },
    guarantor: null,
  }
  const response = await createContract(contractRequest(ownerToken, '', 'POST', body))
  if (response.status !== 201) {
    await prisma.contrato.deleteMany({ where: { tenantId: tenant.id } })
    await prisma.tenant.delete({ where: { id: tenant.id } })
    throw new Error('Falha ao preparar contrato válido para integração.')
  }
  const row = await prisma.contrato.findUniqueOrThrow({
    where: { oportunidadeOrigemId: opportunity.id },
    include: { partes: true },
  })
  return {
    tenantId: tenant.id,
    actorId: actor.id,
    propertyId: property.id,
    opportunityId: opportunity.id,
    contractId: row.id,
    ownerToken,
    agentToken,
    renterToken,
    renterId: renter.id,
    ownerPartyId: row.partes.find((party) => party.papel === 'LOCADOR')!.id,
    tenantPartyId: row.partes.find((party) => party.papel === 'LOCATARIO')!.id,
    editBody: {
      type: body.type,
      amount: body.amount,
      dueDay: body.dueDay,
      startDate: body.startDate,
      endDate: body.endDate,
      adjustmentIndex: body.adjustmentIndex,
      guaranteeType: body.guaranteeType,
      notes: body.notes,
      owner: body.owner,
      tenant: body.tenant,
      guarantor: body.guarantor,
    },
  }
}

export async function createVerifiedContractProof(contractId: string, actorId: string) {
  const contract = await prisma.contrato.findUniqueOrThrow({
    where: { id: contractId },
    select: { tenantId: true, revisaoDados: true },
  })
  const id = randomUUID()
  return prisma.documentoContrato.create({
    data: {
      id,
      contratoId: contractId,
      nome: 'Contrato comprovado.pdf',
      sha256: 'd'.repeat(64),
      tamanhoBytes: 120,
      objectKey: 'contracts/' + contract.tenantId + '/' + contractId + '/' + id + '.pdf',
      enviadoPorId: actorId,
      revisaoContrato: contract.revisaoDados,
    },
  })
}

export async function cleanupContractWorkflowFixture(tenantId: string) {
  await prisma.cobranca.deleteMany({ where: { tenantId } })
  await prisma.contrato.deleteMany({ where: { tenantId } })
  await prisma.tenant.delete({ where: { id: tenantId } })
}
