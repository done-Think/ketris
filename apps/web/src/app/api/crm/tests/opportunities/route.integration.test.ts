import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../../opportunities/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('/api/crm/opportunities (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let propertyId: string
  let otherTenantPropertyId: string
  let contactId: string
  let otherTenantContactId: string
  let activeId: string
  let archivedId: string
  let otherTenantOpportunityId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Opportunities', slug: `crm-op-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { name: 'Outra Imobiliária', slug: `crm-op-other-${randomUUID()}` },
    })
    otherTenantId = other.id

    const actor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Admin',
        email: `admin-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      active: actor.active,
      membershipApprovedAt: actor.membershipApprovedAt,
    })

    const responsible = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: responsible.id,
        title: 'Imóvel',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2000,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    propertyId = property.id

    const contact = await prisma.contact.create({
      data: { tenantId, name: 'Carlos', email: `carlos-${randomUUID()}@exemplo.com` },
    })
    contactId = contact.id

    const active = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Ativo',
        interestedEmail: `ativo-${randomUUID()}@exemplo.com`,
        proposedValue: 2000,
        status: 'SENT',
      },
    })
    activeId = active.id

    const archived = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Arquivado',
        interestedEmail: `arquivado-${randomUUID()}@exemplo.com`,
        proposedValue: 2000,
        status: 'SENT',
        archivedAt: new Date(),
      },
    })
    archivedId = archived.id

    const outroResponsavel = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        name: 'Corretor Outro',
        email: `corretor-outro-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    const outroProperty = await prisma.property.create({
      data: {
        tenantId: otherTenantId,
        responsibleId: outroResponsavel.id,
        title: 'Imóvel de Outro Tenant',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1500,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    otherTenantPropertyId = outroProperty.id

    const outroContact = await prisma.contact.create({
      data: { tenantId: otherTenantId, name: 'Outro', email: `outro-${randomUUID()}@exemplo.com` },
    })
    otherTenantContactId = outroContact.id

    const outraOpportunity = await prisma.opportunity.create({
      data: {
        tenantId: otherTenantId,
        propertyId: otherTenantPropertyId,
        responsibleId: await propertyResponsibleId(prisma, otherTenantPropertyId),
        interestedName: 'De Outro Tenant',
        interestedEmail: `outro-op-${randomUUID()}@exemplo.com`,
        proposedValue: 1500,
        status: 'SENT',
      },
    })
    otherTenantOpportunityId = outraOpportunity.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(query = '', token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPostRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/crm/opportunities', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  describe('GET', () => {
    it('retorna 200 e apenas as oportunidades ativas do tenant do ator', async () => {
      const response = await GET(buildGetRequest('', actorToken))
      const json = await response.json()

      expect(response.status).toBe(200)
      const ids = json.opportunities.map((o: { id: string }) => o.id)
      expect(ids).toContain(activeId)
      expect(ids).not.toContain(archivedId)
      expect(ids).not.toContain(otherTenantOpportunityId)
    })

    it('inclui as arquivadas quando includeArchived=true', async () => {
      const response = await GET(buildGetRequest('?includeArchived=true', actorToken))
      const json = await response.json()

      const ids = json.opportunities.map((o: { id: string }) => o.id)
      expect(ids).toContain(archivedId)
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await GET(buildGetRequest())

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('cria a oportunidade em RASCUNHO por padrão, vinculada ao imóvel do tenant do ator', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: propertyId,
            leadName: 'Novo Lead',
            leadEmail: `lead-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.opportunity.status).toBe('DRAFT')
      expect(json.opportunity.propertyId).toBe(propertyId)
      expect(json.opportunity.tenantId).toBe(tenantId)

      await prisma.opportunity.delete({ where: { id: json.opportunity.id } })
    })

    it('aceita contactId do próprio tenant e vincula a oportunidade a ele', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: propertyId,
            contactId: contactId,
            leadName: 'Lead Vinculado',
            leadEmail: `lead-vinc-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.opportunity.contactId).toBe(contactId)

      await prisma.opportunity.delete({ where: { id: json.opportunity.id } })
    })

    it('retorna 404 quando o propertyId pertence a outro tenant (isolamento multi-tenant)', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: otherTenantPropertyId,
            leadName: 'Tentativa Cross-Tenant',
            leadEmail: `cross-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('OPPORTUNITY_PROPERTY_NOT_FOUND')
    })

    it('retorna 404 quando o contactId pertence a outro tenant (isolamento multi-tenant)', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: propertyId,
            contactId: otherTenantContactId,
            leadName: 'Tentativa Cross-Tenant',
            leadEmail: `cross-contato-${randomUUID()}@exemplo.com`,
            proposedValue: 3000,
          },
          actorToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('CONTACT_NOT_FOUND')
    })

    it('retorna 400 quando falta um campo obrigatório', async () => {
      const response = await POST(buildPostRequest({ propertyId: propertyId }, actorToken))

      expect(response.status).toBe(400)
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await POST(
        buildPostRequest({
          propertyId: propertyId,
          leadName: 'Sem Auth',
          leadEmail: 'x@exemplo.com',
          proposedValue: 1000,
        }),
      )

      expect(response.status).toBe(401)
    })
  })

  describe('escopo por AGENT', () => {
    let agentAToken: string
    let agentBToken: string
    let agentAPropertyId: string
    let agentBPropertyId: string
    let oppAgentAId: string

    beforeAll(async () => {
      const agentA = await prisma.user.create({
        data: {
          tenantId,
          name: 'Corretor A',
          email: `corretor-a-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role: 'AGENT',
        },
      })
      agentAToken = await tokenService.sign({
        id: agentA.id,
        tenantId: agentA.tenantId,
        name: agentA.name,
        email: agentA.email,
        role: agentA.role,
        active: agentA.active,
        membershipApprovedAt: agentA.membershipApprovedAt,
      })

      const agentB = await prisma.user.create({
        data: {
          tenantId,
          name: 'Corretor B',
          email: `corretor-b-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role: 'AGENT',
        },
      })
      agentBToken = await tokenService.sign({
        id: agentB.id,
        tenantId: agentB.tenantId,
        name: agentB.name,
        email: agentB.email,
        role: agentB.role,
        active: agentB.active,
        membershipApprovedAt: agentB.membershipApprovedAt,
      })

      const agentAProperty = await prisma.property.create({
        data: {
          tenantId,
          responsibleId: agentA.id,
          title: 'Imóvel do Corretor A',
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 2200,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      })
      agentAPropertyId = agentAProperty.id

      const agentBProperty = await prisma.property.create({
        data: {
          tenantId,
          responsibleId: agentB.id,
          title: 'Imóvel do Corretor B',
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 2300,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      })
      agentBPropertyId = agentBProperty.id

      const oppAgentA = await prisma.opportunity.create({
        data: {
          tenantId,
          propertyId: agentAPropertyId,
          responsibleId: await propertyResponsibleId(prisma, agentAPropertyId),
          interestedName: 'Lead do Corretor A',
          interestedEmail: `lead-a-${randomUUID()}@exemplo.com`,
          proposedValue: 2200,
          status: 'SENT',
        },
      })
      oppAgentAId = oppAgentA.id
    })

    it('AGENT só vê oportunidades de imóveis dos quais é responsável', async () => {
      const response = await GET(buildGetRequest('', agentAToken))
      const json = await response.json()
      const ids = json.opportunities.map((o: { id: string }) => o.id)

      expect(ids).toContain(oppAgentAId)
      expect(ids).not.toContain(activeId)
    })

    it('outro AGENT não vê a oportunidade que não é sua', async () => {
      const response = await GET(buildGetRequest('', agentBToken))
      const json = await response.json()
      const ids = json.opportunities.map((o: { id: string }) => o.id)

      expect(ids).not.toContain(oppAgentAId)
    })

    it('AGENT cria oportunidade no próprio imóvel normalmente', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: agentAPropertyId,
            leadName: 'Novo Lead do Corretor A',
            leadEmail: `lead-novo-a-${randomUUID()}@exemplo.com`,
            proposedValue: 2500,
          },
          agentAToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(201)

      await prisma.opportunity.delete({ where: { id: json.opportunity.id } })
    })

    it('AGENT recebe 403 ao tentar criar oportunidade em imóvel do qual não é responsável', async () => {
      const response = await POST(
        buildPostRequest(
          {
            propertyId: agentBPropertyId,
            leadName: 'Tentativa Indevida',
            leadEmail: `tentativa-${randomUUID()}@exemplo.com`,
            proposedValue: 2500,
          },
          agentAToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })
})
