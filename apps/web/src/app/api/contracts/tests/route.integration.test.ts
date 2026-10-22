import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST as linkPartyUser } from '../[id]/parties/[partyId]/link-user/route'
import { POST as signParty } from '../[id]/parties/[partyId]/sign/route'
import { GET as getContract } from '../[id]/route'
import { GET, POST } from '../route'

describe('/api/contracts (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
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
      data: { nome: 'Tenant Contracts', slug: `contracts-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
      vinculoAprovadoEm: actor.vinculoAprovadoEm,
    })

    const renter = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Locatário Teste',
        email: `locatario-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'RENTER',
      },
    })
    renterToken = await tokenService.sign({
      id: renter.id,
      tenantId: renter.tenantId,
      nome: renter.nome,
      email: renter.email,
      papel: renter.papel,
      ativo: renter.ativo,
      vinculoAprovadoEm: renter.vinculoAprovadoEm,
    })

    // A RENTER from the shared renters tenant, linked later to the contract's LOCATARIO party.
    const sharedTenant = await prisma.tenant.create({
      data: { nome: 'Locatários', slug: `locatarios-${randomUUID()}` },
    })
    sharedTenantId = sharedTenant.id
    const linkedRenter = await prisma.usuario.create({
      data: {
        tenantId: sharedTenantId,
        nome: 'Mariana Souza',
        email: tenantPartyEmail,
        senhaHash: 'hash-fake',
        papel: 'RENTER',
      },
    })
    linkedRenterToken = await tokenService.sign(linkedRenter)

    adminToken = await createUserToken('ADMIN')
    otherAgentToken = await createUserToken('AGENT')

    const property = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        titulo: 'Apartamento Batel',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2500,
        status: 'PUBLISHED',
      },
    })
    propertyId = property.id

    const acceptedOpportunity = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: propertyId,
        interessadoNome: 'Mariana Souza',
        interessadoEmail: 'mariana@example.com',
        valorProposto: 2500,
        status: 'ACEITA',
      },
    })
    acceptedOpportunityId = acceptedOpportunity.id

    const pendingOpportunity = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: propertyId,
        interessadoNome: 'Rafael Lima',
        interessadoEmail: 'rafael@example.com',
        valorProposto: 2500,
        status: 'EM_NEGOCIACAO',
      },
    })
    pendingOpportunityId = pendingOpportunity.id
  })

  async function createUserToken(papel: 'ADMIN' | 'AGENT'): Promise<string> {
    const user = await prisma.usuario.create({
      data: {
        tenantId,
        nome: `Usuário ${papel}`,
        email: `${papel.toLowerCase()}-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel,
      },
    })

    return tokenService.sign({
      id: user.id,
      tenantId: user.tenantId,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
      ativo: user.ativo,
      vinculoAprovadoEm: user.vinculoAprovadoEm,
    })
  }

  afterAll(async () => {
    if (tenantId) {
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
    type: 'RESIDENCIAL',
    dueDay: 5,
    startDate: '2026-10-01',
    endDate: '2027-10-01',
    adjustmentIndex: 'IGPM',
    guaranteeType: 'CAUCAO',
    owner: { name: 'Bruno Oliveira', cpf: '11111111111', email: 'bruno@example.com' },
    tenant: { name: 'Mariana Souza', cpf: '22222222222', email: tenantPartyEmail },
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
      await prisma.contrato.count({ where: { oportunidadeOrigemId: acceptedOpportunityId } }),
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
    expect(json.contract.status).toBe('AGUARDANDO_ASSINATURA')
    expect(json.contract.amount).toBe(2500)
    expect(json.contract.parties).toHaveLength(2)
    expect(
      json.contract.parties.every(
        (party: { signatureStatus: string }) => party.signatureStatus === 'PENDENTE',
      ),
    ).toBe(true)

    contractId = json.contract.id
    ownerPartyId = json.contract.parties.find(
      (party: { role: string }) => party.role === 'LOCADOR',
    ).id
    tenantPartyId = json.contract.parties.find(
      (party: { role: string }) => party.role === 'LOCATARIO',
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

  it('lista o contrato para o ADMIN, mesmo sem ser o responsável pelo imóvel', async () => {
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
        undefined,
        linkedRenterToken,
      ),
      partyContext(contractId, tenantPartyId),
    )

    expect(response.status).toBe(403)
    expect((await response.json()).error.code).toBe('FORBIDDEN')
    const signature = await prisma.assinatura.findUniqueOrThrow({
      where: { parteContratoId: tenantPartyId },
    })
    expect(signature.status).toBe('PENDENTE')
  })

  function partyContext(id: string, partyId: string) {
    return { params: Promise.resolve({ id, partyId }) }
  }

  it('retorna 404 e não assina quando o AGENT não é o responsável pelo imóvel', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${ownerPartyId}/sign`,
        'POST',
        undefined,
        otherAgentToken,
      ),
      partyContext(contractId, ownerPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('CONTRACT_NOT_FOUND')

    const signature = await prisma.assinatura.findUniqueOrThrow({
      where: { parteContratoId: ownerPartyId },
    })
    expect(signature.status).toBe('PENDENTE')
  })

  it('retorna 403 quando um RENTER tenta assinar', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${ownerPartyId}/sign`,
        'POST',
        undefined,
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
        undefined,
        actorToken,
      ),
      partyContext(contractId, ownerPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.contract.status).toBe('AGUARDANDO_ASSINATURA')
    expect(json.contract.activatedBy).toBeNull()

    const ownerParty = json.contract.parties.find(
      (party: { id: string }) => party.id === ownerPartyId,
    )
    expect(ownerParty.signedBy).toMatchObject({ name: 'Corretor' })

    const property = await prisma.imovel.findUniqueOrThrow({ where: { id: propertyId } })
    expect(property.status).toBe('PUBLISHED')
  })

  it('retorna 409 ao tentar assinar novamente a mesma parte', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${ownerPartyId}/sign`,
        'POST',
        undefined,
        actorToken,
      ),
      partyContext(contractId, ownerPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CONTRACT_PARTY_ALREADY_SIGNED')
  })

  it('ativa o contrato, aluga o imóvel e gera a primeira cobrança quando a última parte assina (pelo ADMIN)', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${tenantPartyId}/sign`,
        'POST',
        undefined,
        adminToken,
      ),
      partyContext(contractId, tenantPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.contract.status).toBe('ATIVO')
    expect(json.contract.activatedAt).not.toBeNull()
    expect(json.contract.activatedBy).toMatchObject({ name: 'Usuário ADMIN' })

    const tenantParty = json.contract.parties.find(
      (party: { id: string }) => party.id === tenantPartyId,
    )
    expect(tenantParty.signedBy).toMatchObject({ name: 'Usuário ADMIN' })

    const property = await prisma.imovel.findUniqueOrThrow({ where: { id: propertyId } })
    expect(property.status).toBe('RENTED')

    const charges = await prisma.cobranca.findMany({ where: { contratoId: contractId } })
    expect(charges).toHaveLength(1)
    expect(charges[0].status).toBe('PENDENTE')
    expect(charges[0].tipo).toBe('A_RECEBER')
    expect(charges[0].valor.toNumber()).toBe(2500)
  })

  it('consulta o contrato ativado pelo id', async () => {
    const response = await getContract(
      buildRequest(`http://localhost/api/contracts/${contractId}`, 'GET', undefined, actorToken),
      { params: Promise.resolve({ id: contractId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.contract.status).toBe('ATIVO')
    expect(
      json.contract.parties.every(
        (party: { signatureStatus: string }) => party.signatureStatus === 'ASSINADA',
      ),
    ).toBe(true)
    expect(json.contract.activatedBy).toMatchObject({ name: 'Usuário ADMIN' })
    expect(
      json.contract.parties.map((party: { signedBy: { name: string } }) => party.signedBy.name),
    ).toEqual(expect.arrayContaining(['Corretor', 'Usuário ADMIN']))
  })

  it('quando duas pessoas assinam a mesma parte ao mesmo tempo, só uma assina e o contrato ativa uma vez', async () => {
    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: propertyId,
        interessadoNome: 'Paula Reis',
        interessadoEmail: 'paula@example.com',
        valorProposto: 3100,
        status: 'ACEITA',
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
    const owner = contract.parties.find((party: { role: string }) => party.role === 'LOCADOR')
    const tenant = contract.parties.find((party: { role: string }) => party.role === 'LOCATARIO')
    const signAs = (partyId: string, token: string) =>
      signParty(
        buildRequest(
          `http://localhost/api/contracts/${contract.id}/parties/${partyId}/sign`,
          'POST',
          undefined,
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
    const winnerName = winnerIndex === 0 ? 'Corretor' : 'Usuário ADMIN'
    const { contract: activated } = await responses[winnerIndex].json()
    expect(activated.status).toBe('ATIVO')
    expect(activated.activatedBy).toMatchObject({ name: winnerName })
    expect(
      activated.parties.find((party: { id: string }) => party.id === tenant.id).signedBy,
    ).toMatchObject({ name: winnerName })

    const charges = await prisma.cobranca.findMany({ where: { contratoId: contract.id } })
    expect(charges).toHaveLength(1)
  })

  it('quando as duas últimas partes assinam ao mesmo tempo, o contrato ativa uma única vez', async () => {
    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId,
        imovelId: propertyId,
        interessadoNome: 'Lucas Prado',
        interessadoEmail: 'lucas@example.com',
        valorProposto: 2800,
        status: 'ACEITA',
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
    const responses = await Promise.all(
      contract.parties.map((party: { id: string }) =>
        signParty(
          buildRequest(
            `http://localhost/api/contracts/${contract.id}/parties/${party.id}/sign`,
            'POST',
            undefined,
            adminToken,
          ),
          partyContext(contract.id, party.id),
        ),
      ),
    )

    expect(responses.map((response) => response.status)).toEqual([200, 200])
    const stored = await prisma.contrato.findUniqueOrThrow({ where: { id: contract.id } })
    expect(stored.status).toBe('ATIVO')
    const charges = await prisma.cobranca.findMany({ where: { contratoId: contract.id } })
    expect(charges).toHaveLength(1)
  })
})
