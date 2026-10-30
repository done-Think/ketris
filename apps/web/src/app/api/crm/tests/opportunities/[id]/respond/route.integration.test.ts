import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST } from '../../../../opportunities/[id]/respond/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('POST /api/crm/opportunities/[id]/respond (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let propertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Respond', slug: `crm-respond-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { name: 'Outra Imobiliária', slug: `crm-respond-other-${randomUUID()}` },
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
    status: 'DRAFT' | 'SENT' | 'IN_NEGOTIATION' | 'ACCEPTED' = 'SENT',
  ) {
    return prisma.opportunity.create({
      data: {
        tenantId,
        propertyId,
        responsibleId: await propertyResponsibleId(prisma, propertyId),
        interestedName: 'Maria',
        interestedEmail: `maria-${randomUUID()}@exemplo.com`,
        proposedValue: 2500,
        status,
      },
    })
  }

  function buildRequest(id: string, body: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities/${id}/respond`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('ACCEPT move a oportunidade para ACEITA e persiste a atividade PROPOSTA_RESPONDIDA', async () => {
    const opportunity = await createOpportunity('SENT')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'ACCEPT' }, actorToken),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.opportunity.status).toBe('ACCEPTED')
    expect(json.activity.type).toBe('PROPOSAL_ANSWERED')
    expect(json.activity.newStatus).toBe('ACCEPTED')

    const persisted = await prisma.opportunityActivity.findUnique({
      where: { id: json.activity.id },
    })
    expect(persisted).not.toBeNull()
    expect(persisted?.description).toBe('')
    expect(persisted?.systemAction).toBe('ACCEPT')
  })

  it('REJECT com mensagem customizada usa a mensagem como descrição da atividade', async () => {
    const opportunity = await createOpportunity('SENT')

    const response = await POST(
      buildRequest(
        opportunity.id,
        { action: 'REJECT', message: 'Valor abaixo do mínimo aceito.' },
        actorToken,
      ),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.opportunity.status).toBe('REJECTED')
    expect(json.activity.description).toBe('Valor abaixo do mínimo aceito.')
  })

  it('REQUEST_INFORMATION move a oportunidade para EM_NEGOCIACAO', async () => {
    const opportunity = await createOpportunity('SENT')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'REQUEST_INFORMATION' }, actorToken),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(json.opportunity.status).toBe('IN_NEGOTIATION')
  })

  it.each([
    ['ACEITAR', 'ACCEPT', 'ACCEPTED'],
    ['RECUSAR', 'REJECT', 'REJECTED'],
    ['SOLICITAR_INFORMACOES', 'REQUEST_INFORMATION', 'IN_NEGOTIATION'],
  ])(
    'rejects legacy %s, accepts %s and preserves stored history',
    async (legacy, action, status) => {
      const opportunity = await createOpportunity('IN_NEGOTIATION')
      const historical = await prisma.opportunityActivity.create({
        data: {
          opportunityId: opportunity.id,
          type: 'PROPOSAL_ANSWERED',
          systemAction: 'SOLICITAR_INFORMACOES',
          description: 'Mensagem original: aceitar depois da visita.',
          previousStatus: 'SENT',
          newStatus: 'IN_NEGOTIATION',
        },
      })
      const rejected = await POST(
        buildRequest(opportunity.id, { action: legacy }, actorToken),
        context(opportunity.id),
      )
      expect(rejected.status).toBe(400)
      expect((await rejected.json()).error.code).toBe('VALIDATION_ERROR')
      expect(await prisma.opportunity.findUnique({ where: { id: opportunity.id } })).toMatchObject({
        status: 'IN_NEGOTIATION',
      })
      expect(
        await prisma.opportunityActivity.count({ where: { opportunityId: opportunity.id } }),
      ).toBe(1)
      const response = await POST(
        buildRequest(opportunity.id, { action }, actorToken),
        context(opportunity.id),
      )
      const json = await response.json()
      expect(response.status).toBe(200)
      expect(json.opportunity.status).toBe(status)
      expect(json.activity.systemAction).toBe(action)
      expect(await prisma.opportunityActivity.findUnique({ where: { id: historical.id } })).toEqual(
        historical,
      )
      expect(
        await prisma.opportunityActivity.findUnique({ where: { id: json.activity.id } }),
      ).toMatchObject({ systemAction: action })
    },
  )

  it('retorna 409 ao tentar responder um rascunho — ainda não foi enviado', async () => {
    const opportunity = await createOpportunity('DRAFT')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'ACCEPT' }, actorToken),
      context(opportunity.id),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('OPPORTUNITY_NOT_ANSWERABLE')
  })

  it('retorna 409 ao tentar responder uma oportunidade já aceita', async () => {
    const opportunity = await createOpportunity('ACCEPTED')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'REJECT' }, actorToken),
      context(opportunity.id),
    )

    expect(response.status).toBe(409)
  })

  it('retorna 400 para uma action inválida', async () => {
    const opportunity = await createOpportunity('SENT')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'APROVAR' }, actorToken),
      context(opportunity.id),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 401 sem Authorization header', async () => {
    const opportunity = await createOpportunity('SENT')

    const response = await POST(
      buildRequest(opportunity.id, { action: 'ACCEPT' }),
      context(opportunity.id),
    )

    expect(response.status).toBe(401)
  })
})
