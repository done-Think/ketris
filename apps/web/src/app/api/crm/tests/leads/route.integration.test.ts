import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../../leads/route'

describe('/api/crm/leads (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let adminToken: string
  let agentAToken: string
  let agentBToken: string
  let renterToken: string
  let leadOfAgentAId: string
  let leadOfAgentBId: string
  let otherTenantLeadId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária CRM Leads', slug: `crm-leads-${randomUUID()}` },
    })
    tenantId = tenant.id

    const other = await prisma.tenant.create({
      data: { name: 'Outra Imobiliária', slug: `crm-leads-other-${randomUUID()}` },
    })
    otherTenantId = other.id

    async function createActor(role: 'OWNER' | 'AGENT' | 'RENTER', ownerTenantId: string) {
      const user = await prisma.user.create({
        data: {
          tenantId: ownerTenantId,
          name: `Usuário ${role}`,
          email: `${role.toLowerCase()}-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role,
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

    const admin = await createActor('OWNER', tenantId)
    adminToken = admin.token

    const agentA = await createActor('AGENT', tenantId)
    agentAToken = agentA.token

    const agentB = await createActor('AGENT', tenantId)
    agentBToken = agentB.token

    const renter = await createActor('RENTER', tenantId)
    renterToken = renter.token

    const leadOfAgentA = await prisma.lead.create({
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
    leadOfAgentAId = leadOfAgentA.id

    const leadOfAgentB = await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: agentB.user.id,
        name: 'Lead do Corretor B',
        phone: '(11) 90000-0002',
        interest: 'Casa',
        budget: 'Até R$ 5.000',
        source: 'INSTAGRAM',
      },
    })
    leadOfAgentBId = leadOfAgentB.id

    const otherAgent = await createActor('AGENT', otherTenantId)
    const otherTenantLead = await prisma.lead.create({
      data: {
        tenantId: otherTenantId,
        responsibleId: otherAgent.user.id,
        name: 'Lead de Outro Tenant',
        phone: '(11) 90000-0003',
        interest: 'Studio',
        budget: 'Até R$ 2.000',
        source: 'WEBSITE',
      },
    })
    otherTenantLeadId = otherTenantLead.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(token?: string): NextRequest {
    return new NextRequest('http://localhost/api/crm/leads', {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  }

  function buildPostRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/crm/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  }

  describe('GET', () => {
    it('OWNER vê os leads de todos os corretores do tenant', async () => {
      const response = await GET(buildGetRequest(adminToken))
      const json = await response.json()
      const ids = json.leads.map((lead: { id: string }) => lead.id)

      expect(response.status).toBe(200)
      expect(ids).toContain(leadOfAgentAId)
      expect(ids).toContain(leadOfAgentBId)
      expect(ids).not.toContain(otherTenantLeadId)
    })

    it('AGENT só vê os próprios leads', async () => {
      const response = await GET(buildGetRequest(agentAToken))
      const json = await response.json()
      const ids = json.leads.map((lead: { id: string }) => lead.id)

      expect(ids).toContain(leadOfAgentAId)
      expect(ids).not.toContain(leadOfAgentBId)
    })

    it('outro AGENT também só vê os próprios leads', async () => {
      const response = await GET(buildGetRequest(agentBToken))
      const json = await response.json()
      const ids = json.leads.map((lead: { id: string }) => lead.id)

      expect(ids).toContain(leadOfAgentBId)
      expect(ids).not.toContain(leadOfAgentAId)
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await GET(buildGetRequest())

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('cria o lead com o ator autenticado como responsável, em estágio NOVO', async () => {
      const response = await POST(
        buildPostRequest(
          {
            name: 'Novo Lead',
            phone: '(11) 98888-0000',
            interest: 'Cobertura',
            budget: 'Até R$ 8.000',
            source: 'MARKETPLACE',
          },
          agentAToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.lead.stage).toBe('NEW')
      expect(json.lead.opportunityId).toBeNull()

      await prisma.lead.delete({ where: { id: json.lead.id } })
    })

    it('retorna 403 quando um RENTER tenta criar um lead', async () => {
      const response = await POST(
        buildPostRequest(
          {
            name: 'Tentativa de locatário',
            phone: '(11) 97777-0000',
            interest: 'Apartamento',
            budget: 'Até R$ 2.000',
            source: 'WEBSITE',
          },
          renterToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
    })

    it('retorna 400 quando falta um campo obrigatório', async () => {
      const response = await POST(buildPostRequest({ name: 'Sem telefone' }, agentAToken))

      expect(response.status).toBe(400)
    })
  })
})
