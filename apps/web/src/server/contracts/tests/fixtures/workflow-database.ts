import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { POST as createContract } from '@/app/api/contracts/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

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
    data: { name: 'Contracts workflow', slug: 'contracts-workflow-' + randomUUID() },
  })
  const actor = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora',
      email: randomUUID() + '@example.test',
      passwordHash: 'test-only',
      role: 'OWNER',
    },
  })
  const agent = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Outro corretor',
      email: randomUUID() + '@example.test',
      passwordHash: 'test-only',
      role: 'AGENT',
    },
  })
  const renter = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Locatário',
      email: randomUUID() + '@example.test',
      passwordHash: 'test-only',
      role: 'RENTER',
    },
  })
  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: actor.id,
      title: 'Apartamento workflow',
      type: 'APARTMENT',
      purpose: 'RENT',
      price: 2000,
      status: 'PUBLISHED',
      publishedAt: new Date('2020-01-01'),
    },
  })
  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      responsibleId: await propertyResponsibleId(prisma, property.id),
      interestedName: renter.name,
      interestedEmail: renter.email,
      status: 'ACCEPTED',
      proposedValue: 2000,
    },
  })
  const tokens = new JoseTokenService()
  const ownerToken = await tokens.sign(actor)
  const agentToken = await tokens.sign(agent)
  const renterToken = await tokens.sign(renter)
  const body = {
    opportunityId: opportunity.id,
    type: 'RESIDENTIAL',
    amount: 1750.75,
    dueDay: 5,
    startDate: '2031-01-01',
    endDate: '2032-01-01',
    adjustmentIndex: 'IPCA',
    guaranteeType: 'DEPOSIT',
    notes: null,
    owner: {
      name: 'Proprietária',
      cpf: '52998224725',
      email: 'owner@example.test',
      phone: '11999999999',
    },
    tenant: { name: renter.name, cpf: '98765432100', email: renter.email, phone: '11999999999' },
    guarantor: null,
  }
  const response = await createContract(contractRequest(ownerToken, '', 'POST', body))
  if (response.status !== 201) {
    await prisma.contract.deleteMany({ where: { tenantId: tenant.id } })
    await prisma.tenant.delete({ where: { id: tenant.id } })
    throw new Error('Falha ao preparar contrato válido para integração.')
  }
  const row = await prisma.contract.findUniqueOrThrow({
    where: { sourceOpportunityId: opportunity.id },
    include: { parties: true },
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
    ownerPartyId: row.parties.find((party) => party.role === 'LANDLORD')!.id,
    tenantPartyId: row.parties.find((party) => party.role === 'RENTER')!.id,
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
  const contract = await prisma.contract.findUniqueOrThrow({
    where: { id: contractId },
    select: { tenantId: true, dataRevision: true },
  })
  const id = randomUUID()
  return prisma.contractDocument.create({
    data: {
      id,
      contractId: contractId,
      name: 'Contrato comprovado.pdf',
      sha256: 'd'.repeat(64),
      sizeBytes: 120,
      objectKey: 'contracts/' + contract.tenantId + '/' + contractId + '/' + id + '.pdf',
      uploadedById: actorId,
      contractRevision: contract.dataRevision,
    },
  })
}

export async function cleanupContractWorkflowFixture(tenantId: string) {
  await prisma.charge.deleteMany({ where: { tenantId } })
  await prisma.contractSignature.deleteMany({
    where: { contractParty: { contract: { tenantId } } },
  })
  await prisma.contract.deleteMany({ where: { tenantId } })
  await prisma.tenant.delete({ where: { id: tenantId } })
}
