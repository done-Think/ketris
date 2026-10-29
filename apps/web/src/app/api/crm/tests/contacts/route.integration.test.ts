import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../../contacts/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('/api/crm/contacts (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let contactWithOpportunityId: string
  let contactWithoutOpportunityId: string
  let otherTenantContactId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Contacts', slug: `crm-contacts-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { name: 'Outra Imobiliária', slug: `crm-contacts-other-${randomUUID()}` },
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

    const withOpportunity = await prisma.contact.create({
      data: { tenantId, name: 'Carlos', email: `carlos-${randomUUID()}@exemplo.com` },
    })
    contactWithOpportunityId = withOpportunity.id

    await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: property.id,
        responsibleId: await propertyResponsibleId(prisma, property.id),
        contactId: contactWithOpportunityId,
        interestedName: 'Carlos',
        interestedEmail: withOpportunity.email,
        proposedValue: 2500,
        status: 'SENT',
      },
    })

    const withoutOpportunity = await prisma.contact.create({
      data: { tenantId, name: 'Beatriz', email: `beatriz-${randomUUID()}@exemplo.com` },
    })
    contactWithoutOpportunityId = withoutOpportunity.id

    const outro = await prisma.contact.create({
      data: {
        tenantId: otherTenantId,
        name: 'De Outro Tenant',
        email: `outro-${randomUUID()}@exemplo.com`,
      },
    })
    otherTenantContactId = outro.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(query = '', token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/contacts${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPostRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/crm/contacts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  describe('GET', () => {
    it('retorna os contatos do tenant do ator com propertyCount agregado corretamente', async () => {
      const response = await GET(buildGetRequest('', actorToken))
      const json = await response.json()

      expect(response.status).toBe(200)
      const byId = Object.fromEntries(json.contacts.map((c: { id: string }) => [c.id, c]))
      expect(byId[contactWithOpportunityId].propertyCount).toBe(1)
      expect(byId[contactWithoutOpportunityId].propertyCount).toBe(0)
      expect(byId[otherTenantContactId]).toBeUndefined()
    })

    it('filtra por busca textual no nome', async () => {
      const response = await GET(buildGetRequest('?q=Carlos', actorToken))
      const json = await response.json()

      const names = json.contacts.map((c: { name: string }) => c.name)
      expect(names).toContain('Carlos')
      expect(names).not.toContain('Beatriz')
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await GET(buildGetRequest())

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('cria o contato com e-mail normalizado para minúsculas', async () => {
      const email = `Novo.Contact.${randomUUID()}@Exemplo.com`

      const response = await POST(buildPostRequest({ name: 'Novo Contato', email }, actorToken))
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.contact.email).toBe(email.toLowerCase())

      await prisma.contact.delete({ where: { id: json.contact.id } })
    })

    it('retorna 409 (constraint real do banco) para e-mail duplicado no mesmo tenant', async () => {
      const email = `duplicado-${randomUUID()}@exemplo.com`
      const first = await POST(buildPostRequest({ name: 'Primeiro', email }, actorToken))
      expect(first.status).toBe(201)

      const second = await POST(buildPostRequest({ name: 'Segundo', email }, actorToken))
      const json = await second.json()

      expect(second.status).toBe(409)
      expect(json.error.code).toBe('CONTACT_EMAIL_ALREADY_EXISTS')

      const firstJson = await first.json()
      await prisma.contact.delete({ where: { id: firstJson.contact.id } })
    })

    it('permite o mesmo e-mail em tenants diferentes (unique é composto com tenantId)', async () => {
      const email = `mesmo-email-${randomUUID()}@exemplo.com`
      await prisma.contact.create({ data: { tenantId: otherTenantId, name: 'Já existe', email } })

      const response = await POST(buildPostRequest({ name: 'Novo', email }, actorToken))
      const json = await response.json()

      expect(response.status).toBe(201)

      await prisma.contact.delete({ where: { id: json.contact.id } })
    })

    it('retorna 400 quando falta um campo obrigatório', async () => {
      const response = await POST(buildPostRequest({ name: 'Sem E-mail' }, actorToken))

      expect(response.status).toBe(400)
    })
  })

  describe('escopo por AGENT', () => {
    let agentAToken: string
    let agentBToken: string
    let contactOfAgentAId: string

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

      const contactOfAgentA = await prisma.contact.create({
        data: { tenantId, name: 'Lead do Corretor A', email: `lead-a-${randomUUID()}@exemplo.com` },
      })
      contactOfAgentAId = contactOfAgentA.id

      await prisma.opportunity.create({
        data: {
          tenantId,
          propertyId: agentAProperty.id,
          responsibleId: await propertyResponsibleId(prisma, agentAProperty.id),
          contactId: contactOfAgentAId,
          interestedName: contactOfAgentA.name,
          interestedEmail: contactOfAgentA.email,
          proposedValue: 2200,
          status: 'SENT',
        },
      })
    })

    it('AGENT só vê contatos com oportunidade em imóvel do qual é responsável', async () => {
      const response = await GET(buildGetRequest('', agentAToken))
      const json = await response.json()
      const ids = json.contacts.map((c: { id: string }) => c.id)

      expect(ids).toContain(contactOfAgentAId)
      expect(ids).not.toContain(contactWithOpportunityId)
      expect(ids).not.toContain(contactWithoutOpportunityId)
    })

    it('outro AGENT não vê o contato que não é seu', async () => {
      const response = await GET(buildGetRequest('', agentBToken))
      const json = await response.json()
      const ids = json.contacts.map((c: { id: string }) => c.id)

      expect(ids).not.toContain(contactOfAgentAId)
    })
  })
})
