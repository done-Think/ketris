import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { createVerifiedContractProof } from '@server/contracts/tests/fixtures/workflow-database'

import { POST as linkPartyUser } from '../[id]/parties/[partyId]/link-user/route'
import { POST as signParty } from '../[id]/parties/[partyId]/sign/route'
import { GET as getContract } from '../[id]/route'
import { GET, POST } from '../route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('/api/contracts (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorId: string
  let proofId: string
  let actorToken: string
  let renterToken: string
  let sharedTenantId: string
  let linkedRenterToken: string
  const tenantPartyEmail = `mariana-${randomUUID()}@example.com`
  let adminToken: string
  let otherAgentToken: string
  let acceptedOpportunityId: string
  let pendingOpportunityId: string
  let propertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Contracts', slug: `contracts-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      active: actor.active,
      membershipApprovedAt: actor.membershipApprovedAt,
    })

    const renter = await prisma.user.create({
      data: {
        tenantId,
        name: 'Locatário Teste',
        email: `locatario-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'RENTER',
      },
    })
    renterToken = await tokenService.sign({
      id: renter.id,
      tenantId: renter.tenantId,
      name: renter.name,
      email: renter.email,
      role: renter.role,
      active: renter.active,
      membershipApprovedAt: renter.membershipApprovedAt,
    })

    // A RENTER from the shared renters tenant, linked later to the contract's LOCATARIO party.
    const sharedTenant = await prisma.tenant.create({
      data: { name: 'Locatários', slug: `locatarios-${randomUUID()}` },
    })
    sharedTenantId = sharedTenant.id
    const linkedRenter = await prisma.user.create({
      data: {
        tenantId: sharedTenantId,
        name: 'Mariana Souza',
        email: tenantPartyEmail,
        passwordHash: 'hash-fake',
        role: 'RENTER',
      },
    })
    linkedRenterToken = await tokenService.sign(linkedRenter)

    adminToken = await createUserToken('OWNER')
    otherAgentToken = await createUserToken('AGENT')

    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: actor.id,
        title: 'Apartamento Batel',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2500,
        status: 'PUBLISHED',
      },
    })
    propertyId = property.id

    const acceptedOpportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Mariana Souza',
        interestedEmail: 'mariana@example.com',
        proposedValue: 2500,
        status: 'ACCEPTED',
      },
    })
    acceptedOpportunityId = acceptedOpportunity.id

    const pendingOpportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Rafael Lima',
        interestedEmail: 'rafael@example.com',
        proposedValue: 2500,
        status: 'IN_NEGOTIATION',
      },
    })
    pendingOpportunityId = pendingOpportunity.id
  })

  async function createUserToken(role: 'OWNER' | 'AGENT'): Promise<string> {
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: `Usuário ${role}`,
        email: `${role.toLowerCase()}-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role,
      },
    })

    return tokenService.sign({
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      membershipApprovedAt: user.membershipApprovedAt,
    })
  }

  afterAll(async () => {
    if (tenantId) {
      await prisma.contractSignature.deleteMany({
        where: { contractParty: { contract: { tenantId } } },
      })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    if (sharedTenantId) {
      await prisma.tenant.delete({ where: { id: sharedTenantId } })
    }
    await prisma.$disconnect()
  })

  function buildRequest(url: string, method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest(url, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  const createPayload = {
    type: 'RESIDENTIAL',
    dueDay: 5,
    startDate: '2026-10-01',
    endDate: '2027-10-01',
    adjustmentIndex: 'IGPM',
    guaranteeType: 'DEPOSIT',
    owner: {
      name: 'Bruno Oliveira',
      cpf: '52998224725',
      email: 'bruno@example.com',
      phone: '11999999999',
    },
    tenant: {
      name: 'Mariana Souza',
      cpf: '98765432100',
      email: tenantPartyEmail,
      phone: '11999999999',
    },
  }

  async function createContractForNewOpportunity() {
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Teste de sequência',
        interestedEmail: `${randomUUID()}@example.com`,
        proposedValue: 2500,
        status: 'ACCEPTED',
      },
    })
    const response = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        { ...createPayload, opportunityId: opportunity.id },
        actorToken,
      ),
    )
    expect(response.status).toBe(201)
    const body = await response.json()
    return body.contract as { id: string; code: string }
  }

  it('retorna 403 quando um RENTER tenta criar contrato', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        {
          ...createPayload,
          opportunityId: acceptedOpportunityId,
        },
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('http://localhost/api/contracts', 'GET'))

    expect(response.status).toBe(401)
  })

  it('retorna 409 ao tentar criar contrato a partir de uma oportunidade não aceita', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        {
          ...createPayload,
          opportunityId: pendingOpportunityId,
        },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CONTRACT_OPPORTUNITY_NOT_ACCEPTED')
  })

  it('retorna 404 quando um AGENT cria contrato a partir de oportunidade de imóvel de outro responsável', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        { ...createPayload, opportunityId: acceptedOpportunityId },
        otherAgentToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('CONTRACT_OPPORTUNITY_NOT_FOUND')
    expect(
      await prisma.contract.count({ where: { sourceOpportunityId: acceptedOpportunityId } }),
    ).toBe(0)
  })

  let contractId: string
  let ownerPartyId: string
  let tenantPartyId: string

  it('cria contrato a partir da oportunidade aceita, com locador e locatário aguardando assinatura', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        {
          ...createPayload,
          opportunityId: acceptedOpportunityId,
        },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.contract.status).toBe('AWAITING_SIGNATURE')
    expect(json.contract.amount).toBe(2500)
    expect(json.contract.parties).toHaveLength(2)
    expect(
      json.contract.parties.every(
        (party: { signatureStatus: string }) => party.signatureStatus === 'PENDING',
      ),
    ).toBe(true)

    contractId = json.contract.id
    proofId = (await createVerifiedContractProof(contractId, actorId)).id
    ownerPartyId = json.contract.parties.find(
      (party: { role: string }) => party.role === 'LANDLORD',
    ).id
    tenantPartyId = json.contract.parties.find(
      (party: { role: string }) => party.role === 'RENTER',
    ).id
  })

  it('retorna 409 ao tentar criar um segundo contrato para a mesma oportunidade', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        {
          ...createPayload,
          opportunityId: acceptedOpportunityId,
        },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CONTRACT_OPPORTUNITY_ALREADY_HAS_CONTRACT')
  })

  it('lista o contrato criado para o tenant do ator', async () => {
    const response = await GET(
      buildRequest('http://localhost/api/contracts', 'GET', undefined, actorToken),
    )
    const json = await response.json()

    const ids = json.items.map((item: { id: string }) => item.id)
    expect(response.status).toBe(200)
    expect(ids).toContain(contractId)
  })

  it('lista o contrato para o OWNER, mesmo sem ser o responsável pelo imóvel', async () => {
    const response = await GET(
      buildRequest('http://localhost/api/contracts', 'GET', undefined, adminToken),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.items.map((item: { id: string }) => item.id)).toContain(contractId)
  })

  it('esconde da lista do AGENT os contratos de imóveis de outro responsável', async () => {
    const response = await GET(
      buildRequest('http://localhost/api/contracts', 'GET', undefined, otherAgentToken),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.items.map((item: { id: string }) => item.id)).not.toContain(contractId)
    expect(json.totalCount).toBe(0)
  })

  it('retorna 404 quando um AGENT consulta contrato de imóvel de outro responsável', async () => {
    const response = await getContract(
      buildRequest(
        `http://localhost/api/contracts/${contractId}`,
        'GET',
        undefined,
        otherAgentToken,
      ),
      { params: Promise.resolve({ id: contractId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('CONTRACT_NOT_FOUND')
  })

  function listAs(token: string, query = '') {
    return GET(buildRequest(`http://localhost/api/contracts${query}`, 'GET', undefined, token))
  }

  function getAs(token: string) {
    return getContract(
      buildRequest(`http://localhost/api/contracts/${contractId}`, 'GET', undefined, token),
      { params: Promise.resolve({ id: contractId }) },
    )
  }

  it('esconde o contrato do RENTER sem vínculo, mesmo no tenant da imobiliária (lista vazia e 404)', async () => {
    const listResponse = await listAs(renterToken)
    const detailResponse = await getAs(renterToken)
    const list = await listResponse.json()

    expect(listResponse.status).toBe(200)
    expect(list.items).toEqual([])
    expect(list.totalCount).toBe(0)
    expect(detailResponse.status).toBe(404)
    expect((await detailResponse.json()).error.code).toBe('CONTRACT_NOT_FOUND')
  })

  it('lista e consulta para o RENTER vinculado o contrato de outra imobiliária, com busca e contagem no mesmo escopo', async () => {
    expect((await listAs(linkedRenterToken)).status).toBe(200)
    expect((await getAs(linkedRenterToken)).status).toBe(404)

    const linkResponse = await linkPartyUser(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${tenantPartyId}/link-user`,
        'POST',
        { email: tenantPartyEmail },
        adminToken,
      ),
      partyContext(contractId, tenantPartyId),
    )
    expect(linkResponse.status).toBe(200)

    const list = await (await listAs(linkedRenterToken)).json()
    expect(list.items.map((item: { id: string }) => item.id)).toEqual([contractId])
    expect(list.totalCount).toBe(1)

    const matching = await (await listAs(linkedRenterToken, '?search=Batel')).json()
    expect(matching.totalCount).toBe(1)
    const notMatching = await (await listAs(linkedRenterToken, '?search=Inexistente')).json()
    expect(notMatching.items).toEqual([])
    expect(notMatching.totalCount).toBe(0)

    const detailResponse = await getAs(linkedRenterToken)
    expect(detailResponse.status).toBe(200)
    expect((await detailResponse.json()).contract.id).toBe(contractId)
  })

  it('retorna 403 quando o RENTER vinculado tenta assinar o contrato que consegue consultar', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${tenantPartyId}/sign`,
        'POST',
        { documentId: proofId },
        linkedRenterToken,
      ),
      partyContext(contractId, tenantPartyId),
    )

    expect(response.status).toBe(403)
    expect((await response.json()).error.code).toBe('FORBIDDEN')
    const signature = await prisma.contractSignature.findUniqueOrThrow({
      where: { contractPartyId: tenantPartyId },
    })
    expect(signature.status).toBe('PENDING')
  })

  function partyContext(id: string, partyId: string) {
    return { params: Promise.resolve({ id, partyId }) }
  }

  it('retorna 404 e não assina quando o AGENT não é o responsável pelo imóvel', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${ownerPartyId}/sign`,
        'POST',
        { documentId: proofId },
        otherAgentToken,
      ),
      partyContext(contractId, ownerPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('CONTRACT_NOT_FOUND')

    const signature = await prisma.contractSignature.findUniqueOrThrow({
      where: { contractPartyId: ownerPartyId },
    })
    expect(signature.status).toBe('PENDING')
  })

  it('retorna 403 quando um RENTER tenta assinar', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${ownerPartyId}/sign`,
        'POST',
        { documentId: proofId },
        renterToken,
      ),
      partyContext(contractId, ownerPartyId),
    )

    expect(response.status).toBe(403)
    expect((await response.json()).error.code).toBe('FORBIDDEN')
  })

  it('mantém o contrato e o imóvel fora do estado ativo enquanto faltam assinaturas', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${ownerPartyId}/sign`,
        'POST',
        { documentId: proofId },
        actorToken,
      ),
      partyContext(contractId, ownerPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.contract.status).toBe('AWAITING_SIGNATURE')
    expect(json.contract.activatedBy).toBeNull()

    const ownerParty = json.contract.parties.find(
      (party: { id: string }) => party.id === ownerPartyId,
    )
    expect(ownerParty.signedBy).toMatchObject({ name: 'Corretor' })

    const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })
    expect(property.status).toBe('PUBLISHED')
  })

  it('retorna 409 ao tentar assinar novamente a mesma parte', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${ownerPartyId}/sign`,
        'POST',
        { documentId: proofId },
        actorToken,
      ),
      partyContext(contractId, ownerPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CONTRACT_PARTY_ALREADY_SIGNED')
  })

  it('ativa o contrato, aluga o imóvel e gera a primeira cobrança quando a última parte assina (pelo OWNER)', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${tenantPartyId}/sign`,
        'POST',
        { documentId: proofId },
        adminToken,
      ),
      partyContext(contractId, tenantPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.contract.status).toBe('ACTIVE')
    expect(json.contract.activatedAt).not.toBeNull()
    expect(json.contract.activatedBy).toMatchObject({ name: 'Usuário OWNER' })

    const tenantParty = json.contract.parties.find(
      (party: { id: string }) => party.id === tenantPartyId,
    )
    expect(tenantParty.signedBy).toMatchObject({ name: 'Usuário OWNER' })

    const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })
    expect(property.status).toBe('RENTED')

    const charges = await prisma.charge.findMany({ where: { contractId: contractId } })
    expect(charges).toHaveLength(1)
    expect(charges[0].status).toBe('PENDING')
    expect(charges[0].type).toBe('RECEIVABLE')
    expect(charges[0].amount.toNumber()).toBe(2500)
  })

  it('consulta o contrato ativado pelo id', async () => {
    const response = await getContract(
      buildRequest(`http://localhost/api/contracts/${contractId}`, 'GET', undefined, actorToken),
      { params: Promise.resolve({ id: contractId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.contract.status).toBe('ACTIVE')
    expect(
      json.contract.parties.every(
        (party: { signatureStatus: string }) => party.signatureStatus === 'SIGNED',
      ),
    ).toBe(true)
    expect(json.contract.activatedBy).toMatchObject({ name: 'Usuário OWNER' })
    expect(
      json.contract.parties.map((party: { signedBy: { name: string } }) => party.signedBy.name),
    ).toEqual(expect.arrayContaining(['Corretor', 'Usuário OWNER']))
  })

  it('quando duas pessoas assinam a mesma parte ao mesmo tempo, só uma assina e o contrato ativa uma vez', async () => {
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Paula Reis',
        interestedEmail: 'paula@example.com',
        proposedValue: 3100,
        status: 'ACCEPTED',
      },
    })
    const created = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        { ...createPayload, opportunityId: opportunity.id },
        actorToken,
      ),
    )
    const { contract } = await created.json()
    const owner = contract.parties.find((party: { role: string }) => party.role === 'LANDLORD')
    const tenant = contract.parties.find((party: { role: string }) => party.role === 'RENTER')
    const proof = await createVerifiedContractProof(contract.id, actorId)
    const signAs = (partyId: string, token: string) =>
      signParty(
        buildRequest(
          `http://localhost/api/contracts/${contract.id}/parties/${partyId}/sign`,
          'POST',
          { documentId: proof.id },
          token,
        ),
        partyContext(contract.id, partyId),
      )

    await signAs(owner.id, actorToken)
    const responses = await Promise.all([
      signAs(tenant.id, actorToken),
      signAs(tenant.id, adminToken),
    ])

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
    const winnerIndex = responses.findIndex((response) => response.status === 200)
    const winnerName = winnerIndex === 0 ? 'Corretor' : 'Usuário OWNER'
    const { contract: activated } = await responses[winnerIndex].json()
    expect(activated.status).toBe('ACTIVE')
    expect(activated.activatedBy).toMatchObject({ name: winnerName })
    expect(
      activated.parties.find((party: { id: string }) => party.id === tenant.id).signedBy,
    ).toMatchObject({ name: winnerName })

    const charges = await prisma.charge.findMany({ where: { contractId: contract.id } })
    expect(charges).toHaveLength(1)
  })

  it('quando as duas últimas partes assinam ao mesmo tempo, o contrato ativa uma única vez', async () => {
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Lucas Prado',
        interestedEmail: 'lucas@example.com',
        proposedValue: 2800,
        status: 'ACCEPTED',
      },
    })
    const created = await POST(
      buildRequest(
        'http://localhost/api/contracts',
        'POST',
        { ...createPayload, opportunityId: opportunity.id },
        actorToken,
      ),
    )
    const { contract } = await created.json()
    const proof = await createVerifiedContractProof(contract.id, actorId)
    const responses = await Promise.all(
      contract.parties.map((party: { id: string }) =>
        signParty(
          buildRequest(
            `http://localhost/api/contracts/${contract.id}/parties/${party.id}/sign`,
            'POST',
            { documentId: proof.id },
            adminToken,
          ),
          partyContext(contract.id, party.id),
        ),
      ),
    )

    expect(responses.map((response) => response.status)).toEqual([200, 200])
    const stored = await prisma.contract.findUniqueOrThrow({ where: { id: contract.id } })
    expect(stored.status).toBe('ACTIVE')
    const charges = await prisma.charge.findMany({ where: { contractId: contract.id } })
    expect(charges).toHaveLength(1)
  })

  it('recusa a segunda criação simultânea para a mesma proposta com conflito', async () => {
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Concorrência',
        interestedEmail: 'concurrent@example.test',
        proposedValue: 2500,
        status: 'ACCEPTED',
      },
    })
    const create = () =>
      POST(
        buildRequest(
          'http://localhost/api/contracts',
          'POST',
          {
            ...createPayload,
            opportunityId: opportunity.id,
          },
          actorToken,
        ),
      )
    const responses = await Promise.all([create(), create()])
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409])
    expect(await prisma.contract.count({ where: { sourceOpportunityId: opportunity.id } })).toBe(1)
  })

  it('gera um código livre após excluir um contrato anterior da sequência', async () => {
    const first = await createContractForNewOpportunity()
    const second = await createContractForNewOpportunity()
    await prisma.contract.delete({ where: { id: first.id } })

    const third = await createContractForNewOpportunity()

    expect(third.code).not.toBe(second.code)
    expect(third.code).toMatch(/^CTR-\d{4}-\d{4,}$/)
  })

  it('gera códigos distintos para contratos criados simultaneamente', async () => {
    const contracts = await Promise.all(
      Array.from({ length: 6 }, () => createContractForNewOpportunity()),
    )

    expect(new Set(contracts.map((contract) => contract.code)).size).toBe(6)
  })
})
