import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET as LIST } from '../../../../opportunities/route'
import { GET } from '../../../../opportunities/[id]/route'
import { GET as ACTIVITIES } from '../../../../opportunities/[id]/activities/route'
import { PUT } from '../../../../opportunities/[id]/responsible/route'

describe('/api/crm/opportunities/[id]/responsible (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let ownerToken: string
  let propertyAgentToken: string
  let assigneeToken: string
  let propertyAgentId: string
  let assigneeId: string
  let inactiveId: string
  let propertyId: string

  async function user(role: 'OWNER' | 'AGENT', name: string, active = true) {
    const created = await prisma.user.create({
      data: {
        tenantId,
        name,
        email: `${randomUUID()}@responsavel.test`,
        passwordHash: 'hash-fake',
        role,
        active,
      },
    })
    const token = await tokenService.sign({
      id: created.id,
      tenantId,
      name: created.name,
      email: created.email,
      role: created.role,
      active: created.active,
      membershipApprovedAt: created.membershipApprovedAt,
    })

    return { id: created.id, token }
  }

  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({
        data: { name: 'Imobiliária Responsável', slug: `crm-resp-${randomUUID()}` },
      })
    ).id
    ownerToken = (await user('OWNER', 'Gestora')).token
    const propertyAgent = await user('AGENT', 'Ana Imóvel')
    propertyAgentId = propertyAgent.id
    propertyAgentToken = propertyAgent.token
    const assignee = await user('AGENT', 'Bruno Oportunidade')
    assigneeId = assignee.id
    assigneeToken = assignee.token
    inactiveId = (await user('AGENT', 'Carla Inativa', false)).id
    propertyId = (
      await prisma.property.create({
        data: {
          tenantId,
          responsibleId: propertyAgentId,
          title: 'Imóvel da Ana',
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 2000,
        },
      })
    ).id
  })

  afterAll(async () => {
    await prisma.opportunity.deleteMany({ where: { tenantId } })
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  async function opportunity() {
    return prisma.opportunity.create({
      data: {
        tenantId,
        propertyId,
        responsibleId: propertyAgentId,
        interestedName: 'Maria',
        interestedEmail: `${randomUUID()}@exemplo.com`,
        proposedValue: 2500,
        status: 'SENT',
      },
    })
  }

  function request(path: string, token: string, body?: unknown) {
    return new NextRequest(`http://localhost/api/crm/${path}`, {
      method: body ? 'PUT' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
    })
  }

  const context = (id: string) => ({ params: Promise.resolve({ id }) })

  it('o OWNER troca o responsável e o acesso do AGENT passa a seguir a oportunidade', async () => {
    const { id } = await opportunity()

    const response = await PUT(
      request(`opportunities/${id}/responsible`, ownerToken, { responsibleId: assigneeId }),
      context(id),
    )
    expect(response.status).toBe(200)
    expect((await response.json()).opportunity).toMatchObject({
      responsibleId: assigneeId,
      responsibleName: 'Bruno Oportunidade',
    })

    expect((await GET(request(`opportunities/${id}`, assigneeToken), context(id))).status).toBe(200)
    expect(
      (await GET(request(`opportunities/${id}`, propertyAgentToken), context(id))).status,
    ).toBe(404)
    const assigneeList = await (await LIST(request('opportunities', assigneeToken))).json()
    expect(assigneeList.opportunities.map((item: { id: string }) => item.id)).toContain(id)
    const propertyAgentList = await (
      await LIST(request('opportunities', propertyAgentToken))
    ).json()
    expect(propertyAgentList.opportunities.map((item: { id: string }) => item.id)).not.toContain(id)

    const activities = await (
      await ACTIVITIES(request(`opportunities/${id}/activities`, ownerToken), context(id))
    ).json()
    expect(activities.activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          systemAction: 'RESPONSIBLE_CHANGED',
          description: 'Ana Imóvel → Bruno Oportunidade',
        }),
      ]),
    )
  })

  it('só o OWNER troca o responsável', async () => {
    const { id } = await opportunity()

    const response = await PUT(
      request(`opportunities/${id}/responsible`, propertyAgentToken, {
        responsibleId: assigneeId,
      }),
      context(id),
    )

    expect(response.status).toBe(403)
    expect((await prisma.opportunity.findUniqueOrThrow({ where: { id } })).responsibleId).toBe(
      propertyAgentId,
    )
  })

  it('recusa responsável inativo ou de fora da equipe', async () => {
    const { id } = await opportunity()

    for (const responsibleId of [inactiveId, 'nao-existe']) {
      const response = await PUT(
        request(`opportunities/${id}/responsible`, ownerToken, { responsibleId }),
        context(id),
      )
      expect(response.status).toBe(422)
      expect((await response.json()).error.code).toBe('INVALID_OPPORTUNITY_RESPONSIBLE')
    }
  })
})
