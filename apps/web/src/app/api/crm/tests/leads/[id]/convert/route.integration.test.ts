import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST } from '../../../../leads/[id]/convert/route'

describe('/api/crm/leads/[id]/convert (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let agentToken: string
  let agentId: string
  let otherAgentToken: string
  let propertyId: string
  let otherTenantPropertyId: string
  let propertyOfOtherAgentId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Lead Convert', slug: `crm-lead-convert-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Outra Imobiliária', slug: `crm-lead-convert-other-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const agent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    agentId = agent.id
    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      active: agent.active,
      membershipApprovedAt: agent.membershipApprovedAt,
    })

    const otherAgent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Outro Corretor',
        email: `outro-corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    otherAgentToken = await tokenService.sign({
      id: otherAgent.id,
      tenantId: otherAgent.tenantId,
      name: otherAgent.name,
      email: otherAgent.email,
      role: otherAgent.role,
      active: otherAgent.active,
      membershipApprovedAt: otherAgent.membershipApprovedAt,
    })

    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: agent.id,
        title: 'Apartamento do Corretor',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 3000,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    propertyId = property.id

    const otherTenantAgent = await prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        name: 'Corretor de Outro Tenant',
        email: `outro-tenant-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    const otherTenantProperty = await prisma.property.create({
      data: {
        tenantId: otherTenant.id,
        responsibleId: otherTenantAgent.id,
        title: 'Imóvel de outro tenant',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1800,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    otherTenantPropertyId = otherTenantProperty.id

    const propertyOfOtherAgent = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: otherAgent.id,
        title: 'Imóvel do Outro Corretor',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2500,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    propertyOfOtherAgentId = propertyOfOtherAgent.id
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenantId] } } })
    await prisma.$disconnect()
  })

  async function createLead() {
    return prisma.lead.create({
      data: {
        tenantId,
        responsibleId: agentId,
        name: 'Maria Souza',
        phone: '(11) 90000-0001',
        email: 'maria@exemplo.com',
        interest: 'Apartamento 2 quartos',
        budget: 'Até R$ 3.000',
        source: 'WHATSAPP',
        notes: 'Gostou muito da varanda.',
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
    expect(json.lead.stage).toBe('PROPOSAL')
    expect(json.lead.opportunityId).toBe(json.opportunityId)

    const opportunity = await prisma.opportunity.findUniqueOrThrow({
      where: { id: json.opportunityId },
    })
    expect(opportunity.status).toBe('DRAFT')
    expect(opportunity.propertyId).toBe(propertyId)
    expect(Number(opportunity.proposedValue)).toBe(3200)
    expect(opportunity.interestedName).toBe('Maria Souza')
    expect(opportunity.notes).toBe('Gostou muito da varanda.')
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
