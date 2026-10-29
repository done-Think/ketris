import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, PATCH } from '../../../leads/[id]/route'

describe('/api/crm/leads/[id] (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let agentAToken: string
  let agentBToken: string
  let leadId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Lead Detail', slug: `crm-lead-detail-${randomUUID()}` },
    })
    tenantId = tenant.id

    async function createAgent() {
      const user = await prisma.user.create({
        data: {
          tenantId,
          name: 'Corretor',
          email: `corretor-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role: 'AGENT',
        },
      })

      const token = await tokenService.sign({
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        membershipApprovedAt: user.membershipApprovedAt,
      })

      return { user, token }
    }

    const agentA = await createAgent()
    agentAToken = agentA.token

    const agentB = await createAgent()
    agentBToken = agentB.token

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: agentA.user.id,
        name: 'Lead do Corretor A',
        phone: '(11) 90000-0001',
        interest: 'Apartamento 2 quartos',
        budget: 'Até R$ 3.000',
        source: 'WHATSAPP',
      },
    })
    leadId = lead.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(id: string, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/leads/${id}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPatchRequest(id: string, body: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  describe('GET', () => {
    it('o corretor responsável consegue ler o próprio lead', async () => {
      const response = await GET(buildGetRequest(leadId, agentAToken), {
        params: Promise.resolve({ id: leadId }),
      })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.lead.id).toBe(leadId)
    })

    it('outro corretor recebe 404 opaco para um lead que não é seu', async () => {
      const response = await GET(buildGetRequest(leadId, agentBToken), {
        params: Promise.resolve({ id: leadId }),
      })
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('LEAD_NOT_FOUND')
    })
  })

  describe('PATCH', () => {
    it('atualiza o estágio do lead', async () => {
      const response = await PATCH(
        buildPatchRequest(leadId, { stage: 'IN_CONTACT' }, agentAToken),
        {
          params: Promise.resolve({ id: leadId }),
        },
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.lead.stage).toBe('IN_CONTACT')
    })

    it('retorna 400 quando nenhum campo é informado', async () => {
      const response = await PATCH(buildPatchRequest(leadId, {}, agentAToken), {
        params: Promise.resolve({ id: leadId }),
      })

      expect(response.status).toBe(400)
    })

    it('outro corretor não consegue atualizar um lead que não é seu', async () => {
      const response = await PATCH(buildPatchRequest(leadId, { stage: 'PROPOSAL' }, agentBToken), {
        params: Promise.resolve({ id: leadId }),
      })
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('LEAD_NOT_FOUND')
    })
  })
})
