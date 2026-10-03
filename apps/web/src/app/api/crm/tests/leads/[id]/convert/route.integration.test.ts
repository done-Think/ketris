import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST } from '../../../../leads/[id]/convert/route'

describe('/api/crm/leads/[id]/convert (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let agentToken: string
  let agentId: string
  let otherAgentToken: string
  let propertyId: string
  let otherTenantPropertyId: string
  let propertyOfOtherAgentId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária CRM Lead Convert', slug: `crm-lead-convert-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `crm-lead-convert-other-${randomUUID()}` },
    })

    const agent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    agentId = agent.id
    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      nome: agent.nome,
      email: agent.email,
      papel: agent.papel,
      ativo: agent.ativo,
      vinculoAprovadoEm: agent.vinculoAprovadoEm,
    })

    const otherAgent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Outro Corretor',
        email: `outro-corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    otherAgentToken = await tokenService.sign({
      id: otherAgent.id,
      tenantId: otherAgent.tenantId,
      nome: otherAgent.nome,
      email: otherAgent.email,
      papel: otherAgent.papel,
      ativo: otherAgent.ativo,
      vinculoAprovadoEm: otherAgent.vinculoAprovadoEm,
    })

    const property = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: agent.id,
        titulo: 'Apartamento do Corretor',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 3000,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    propertyId = property.id

    const otherTenantAgent = await prisma.usuario.create({
      data: {
        tenantId: otherTenant.id,
        nome: 'Corretor de Outro Tenant',
        email: `outro-tenant-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    const otherTenantProperty = await prisma.imovel.create({
      data: {
        tenantId: otherTenant.id,
        responsavelId: otherTenantAgent.id,
        titulo: 'Imóvel de outro tenant',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 1800,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    otherTenantPropertyId = otherTenantProperty.id

    const propertyOfOtherAgent = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: otherAgent.id,
        titulo: 'Imóvel do Outro Corretor',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2500,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    propertyOfOtherAgentId = propertyOfOtherAgent.id
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId] } } })
    await prisma.$disconnect()
  })

  async function createLead() {
    return prisma.lead.create({
      data: {
        tenantId,
        responsavelId: agentId,
        nome: 'Maria Souza',
        telefone: '(11) 90000-0001',
        email: 'maria@exemplo.com',
        interesse: 'Apartamento 2 quartos',
        orcamento: 'Até R$ 3.000',
        origem: 'WhatsApp',
        observacoes: 'Gostou muito da varanda.',
      },
    })
  }

  function buildRequest(id: string, body: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/leads/${id}/convert`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  it('converte o lead numa oportunidade em RASCUNHO, copiando os dados do lead', async () => {
    const lead = await createLead()

    const response = await POST(
      buildRequest(lead.id, { propertyId, proposedValue: 3200 }, agentToken),
      { params: Promise.resolve({ id: lead.id }) },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.lead.stage).toBe('PROPOSTA')
    expect(json.lead.opportunityId).toBe(json.opportunityId)

    const opportunity = await prisma.oportunidade.findUniqueOrThrow({
      where: { id: json.opportunityId },
    })
    expect(opportunity.status).toBe('RASCUNHO')
    expect(opportunity.imovelId).toBe(propertyId)
    expect(Number(opportunity.valorProposto)).toBe(3200)
    expect(opportunity.interessadoNome).toBe('Maria Souza')
    expect(opportunity.observacoes).toBe('Gostou muito da varanda.')
  })

  it('retorna 409 ao tentar converter um lead já convertido', async () => {
    const lead = await createLead()

    const first = await POST(
      buildRequest(lead.id, { propertyId, proposedValue: 3000 }, agentToken),
      {
        params: Promise.resolve({ id: lead.id }),
      },
    )
    expect(first.status).toBe(200)

    const second = await POST(
      buildRequest(lead.id, { propertyId, proposedValue: 3000 }, agentToken),
      { params: Promise.resolve({ id: lead.id }) },
    )
    const json = await second.json()

    expect(second.status).toBe(409)
    expect(json.error.code).toBe('LEAD_ALREADY_CONVERTED')
  })

  it('retorna 404 quando o imóvel não pertence ao tenant do ator', async () => {
    const lead = await createLead()

    const response = await POST(
      buildRequest(lead.id, { propertyId: otherTenantPropertyId, proposedValue: 3000 }, agentToken),
      { params: Promise.resolve({ id: lead.id }) },
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('OPPORTUNITY_PROPERTY_NOT_FOUND')
  })

  it('bloqueia um AGENT convertendo o próprio lead com um imóvel do qual não é responsável', async () => {
    const lead = await createLead()

    const response = await POST(
      buildRequest(
        lead.id,
        { propertyId: propertyOfOtherAgentId, proposedValue: 3000 },
        agentToken,
      ),
      { params: Promise.resolve({ id: lead.id }) },
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('outro corretor recebe 404 opaco ao tentar converter um lead que não é seu', async () => {
    const lead = await createLead()

    const response = await POST(
      buildRequest(lead.id, { propertyId, proposedValue: 3000 }, otherAgentToken),
      { params: Promise.resolve({ id: lead.id }) },
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('LEAD_NOT_FOUND')
  })
})
