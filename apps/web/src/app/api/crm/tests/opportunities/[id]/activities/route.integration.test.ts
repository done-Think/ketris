import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../../../../opportunities/[id]/activities/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('/api/crm/opportunities/[id]/activities (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorToken: string
  let opportunityId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Activities', slug: `crm-act-${randomUUID()}` },
    })
    tenantId = tenant.id

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

    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: property.id,
        responsibleId: await propertyResponsibleId(prisma, property.id),
        interestedName: 'Maria',
        interestedEmail: `maria-${randomUUID()}@exemplo.com`,
        proposedValue: 2500,
        status: 'SENT',
      },
    })
    opportunityId = opportunity.id

    await prisma.opportunityActivity.create({
      data: { opportunityId: opportunityId, type: 'NOTE', description: 'Nota inicial de fixture.' },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities/${opportunityId}/activities`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPostRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/opportunities/${opportunityId}/activities`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  function context() {
    return { params: Promise.resolve({ id: opportunityId }) }
  }

  it('GET retorna a timeline da oportunidade', async () => {
    const response = await GET(buildGetRequest(actorToken), context())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.activities.length).toBeGreaterThanOrEqual(1)
    expect(json.activities[0].description).toBe('Nota inicial de fixture.')
  })

  it('GET retorna 401 sem Authorization header', async () => {
    const response = await GET(buildGetRequest(), context())

    expect(response.status).toBe(401)
  })

  it('POST cria uma nota e ela aparece na listagem em seguida', async () => {
    const response = await POST(
      buildPostRequest({ description: 'Ligou para confirmar a visita.' }, actorToken),
      context(),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.activity.type).toBe('NOTE')
    expect(json.activity.description).toBe('Ligou para confirmar a visita.')

    const listResponse = await GET(buildGetRequest(actorToken), context())
    const listJson = await listResponse.json()
    const ids = listJson.activities.map((a: { id: string }) => a.id)
    expect(ids).toContain(json.activity.id)
  })

  it('POST retorna 400 com descrição vazia', async () => {
    const response = await POST(buildPostRequest({ description: '' }, actorToken), context())

    expect(response.status).toBe(400)
  })
})
