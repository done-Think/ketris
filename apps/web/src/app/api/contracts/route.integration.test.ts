import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST as signParty } from './[id]/parties/[partyId]/sign/route'
import { GET as getContract } from './[id]/route'
import { GET, POST } from './route'

describe('/api/contracts (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorToken: string
  let renterToken: string
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

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({ where: { id: tenantId } })
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
    tenant: { name: 'Mariana Souza', cpf: '22222222222', email: 'mariana@example.com' },
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

  function partyContext(id: string, partyId: string) {
    return { params: Promise.resolve({ id, partyId }) }
  }

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

  it('ativa o contrato, aluga o imóvel e gera a primeira cobrança quando a última parte assina', async () => {
    const response = await signParty(
      buildRequest(
        `http://localhost/api/contracts/${contractId}/parties/${tenantPartyId}/sign`,
        'POST',
        undefined,
        actorToken,
      ),
      partyContext(contractId, tenantPartyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.contract.status).toBe('ATIVO')
    expect(json.contract.activatedAt).not.toBeNull()

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
  })
})
