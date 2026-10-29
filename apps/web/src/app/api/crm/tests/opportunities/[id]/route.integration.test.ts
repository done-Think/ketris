import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE, GET, PATCH } from '../../../opportunities/[id]/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('/api/crm/opportunities/[id] (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let propertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Opportunity Detail', slug: `crm-op-id-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { name: 'Outra Imobiliária', slug: `crm-op-id-other-${randomUUID()}` },
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
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  async function createOpportunity(
    overrides: Partial<{
      status: 'DRAFT' | 'SENT' | 'IN_NEGOTIATION' | 'ACCEPTED' | 'REJECTED'
    }> = {},
  ) {
    return prisma.opportunity.create({
      data: {
        tenantId,
        propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Maria',
        interestedEmail: `maria-${randomUUID()}@exemplo.com`,
        proposedValue: 2500,
        status: overrides.status ?? 'SENT',
      },
    })
  }

  function buildRequest(
    id: string,
    init: { method?: string; token?: string; body?: string } = {},
  ): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities/${id}`, {
      method: init.method,
      body: init.body,
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
      },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  describe('GET', () => {
    it('retorna 200 para uma oportunidade do tenant do ator', async () => {
      const opportunity = await createOpportunity()

      const response = await GET(
        buildRequest(opportunity.id, { token: actorToken }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.opportunity.id).toBe(opportunity.id)
    })

    it('retorna 404 (opaco) para uma oportunidade de outro tenant', async () => {
      const responsible = await prisma.user.create({
        data: {
          tenantId: otherTenantId,
          name: 'Corretor Outro',
          email: `corretor-outro-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role: 'AGENT',
        },
      })
      const otherProperty = await prisma.property.create({
        data: {
          tenantId: otherTenantId,
          responsibleId: responsible.id,
          title: 'Imóvel Outro',
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 1500,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      })
      const opportunity = await prisma.opportunity.create({
        data: {
          tenantId: otherTenantId,
          propertyId: otherProperty.id,
          responsibleId: await propertyResponsibleId(prisma, otherProperty.id),
          interestedName: 'De Outro Tenant',
          interestedEmail: `outro-${randomUUID()}@exemplo.com`,
          proposedValue: 1500,
          status: 'SENT',
        },
      })

      const response = await GET(
        buildRequest(opportunity.id, { token: actorToken }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('OPPORTUNITY_NOT_FOUND')
    })

    it('retorna 401 sem Authorization header', async () => {
      const opportunity = await createOpportunity()

      const response = await GET(buildRequest(opportunity.id), context(opportunity.id))

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH', () => {
    it('atualiza campos e permite uma transição de status válida', async () => {
      const opportunity = await createOpportunity({ status: 'SENT' })

      const response = await PATCH(
        buildRequest(opportunity.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({ status: 'IN_NEGOTIATION' }),
        }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.opportunity.status).toBe('IN_NEGOTIATION')

      const activities = await prisma.opportunityActivity.findMany({
        where: { opportunityId: opportunity.id },
      })
      expect(activities).toHaveLength(1)
      expect(activities[0]?.type).toBe('STATUS_CHANGE')
    })

    it('retorna 409 para uma transição de status inválida (ACEITA é terminal)', async () => {
      const opportunity = await createOpportunity({ status: 'ACCEPTED' })

      const response = await PATCH(
        buildRequest(opportunity.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({ status: 'SENT' }),
        }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error.code).toBe('INVALID_STATUS_TRANSITION')

      const reloaded = await prisma.opportunity.findUniqueOrThrow({
        where: { id: opportunity.id },
      })
      expect(reloaded.status).toBe('ACCEPTED')
    })

    it('retorna 400 com corpo vazio', async () => {
      const opportunity = await createOpportunity()

      const response = await PATCH(
        buildRequest(opportunity.id, {
          method: 'PATCH',
          token: actorToken,
          body: JSON.stringify({}),
        }),
        context(opportunity.id),
      )

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE', () => {
    it('sem permanent: arquiva (soft delete) e retorna 200 com archivedAt preenchido', async () => {
      const opportunity = await createOpportunity()

      const response = await DELETE(
        buildRequest(opportunity.id, { method: 'DELETE', token: actorToken }),
        context(opportunity.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.opportunity.archivedAt).not.toBeNull()

      const reloaded = await prisma.opportunity.findUniqueOrThrow({
        where: { id: opportunity.id },
      })
      expect(reloaded.archivedAt).not.toBeNull()
    })

    it('com permanent=true: remove o registro do banco e retorna 204', async () => {
      const opportunity = await createOpportunity()

      const response = await DELETE(
        buildRequest(`${opportunity.id}?permanent=true`, { method: 'DELETE', token: actorToken }),
        context(opportunity.id),
      )

      expect(response.status).toBe(204)

      const reloaded = await prisma.opportunity.findUnique({ where: { id: opportunity.id } })
      expect(reloaded).toBeNull()
    })
  })
})
