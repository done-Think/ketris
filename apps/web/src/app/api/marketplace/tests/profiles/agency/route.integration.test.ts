import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET as getAgencyPublic } from '../../../agencies/[id]/route'
import { GET, PUT } from '../../../profiles/agency/route'
import { POST as publish } from '../../../profiles/agency/publish/route'
import { POST as unpublish } from '../../../profiles/agency/unpublish/route'

describe('/api/marketplace/profiles/agency (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let adminToken: string
  let agentToken: string
  let teamAgentId: string
  let otherTenantAgentId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Perfil Agência', slug: `perfil-agencia-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Outra Imobiliária', slug: `perfil-agencia-outra-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const admin = await prisma.user.create({
      data: {
        tenantId,
        name: 'Admin da Imobiliária',
        email: `admin-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      active: admin.active,
      membershipApprovedAt: admin.membershipApprovedAt,
    })

    const agent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Camila Rocha',
        email: `camila-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    teamAgentId = agent.id
    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      active: agent.active,
      membershipApprovedAt: agent.membershipApprovedAt,
    })

    const otherTenantAgent = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        name: 'Corretor de Outro Tenant',
        email: `outro-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    otherTenantAgentId = otherTenantAgent.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body: unknown, token: string): NextRequest {
    return new NextRequest('http://localhost/api/marketplace/profiles/agency', {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    })
  }

  it('GET retorna null quando a imobiliária ainda não criou o perfil', async () => {
    const response = await GET(buildRequest('GET', undefined, adminToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.profile).toBeNull()
  })

  it('PUT retorna 403 quando o ator é AGENT (não OWNER)', async () => {
    const response = await PUT(
      buildRequest(
        'PUT',
        { displayName: 'Imobiliária', coverage: [], segments: [], team: [] },
        agentToken,
      ),
    )

    expect(response.status).toBe(403)
  })

  it('só aceita destacar usuários do próprio tenant, ignora ids de outro tenant', async () => {
    const response = await PUT(
      buildRequest(
        'PUT',
        {
          displayName: 'Imobiliária Perfil Agência',
          headline: 'A imobiliária que entende você',
          summary: 'A imobiliária mais completa da cidade.',
          legalCreci: 'SP-654321',
          headquarters: 'São Paulo, SP',
          address: 'Av. Paulista, 1000',
          phone: '(11) 90000-0000',
          coverage: ['Zona Sul', 'Zona Oeste'],
          segments: ['Residencial', 'Comercial'],
          yearsInMarket: 15,
          backgroundColor: '#ffffff',
          logoUrl: 'https://cdn.ketris.com.br/logo.jpg',
          bannerUrl: 'https://cdn.ketris.com.br/banner.jpg',
          team: [
            { userId: teamAgentId, order: 0 },
            { userId: otherTenantAgentId, order: 1 },
          ],
        },
        adminToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    const teamIds = json.profile.team.map((member: { userId: string }) => member.userId)
    expect(teamIds).toContain(teamAgentId)
    expect(teamIds).not.toContain(otherTenantAgentId)
  })

  it('publica e fica visível no diretório público; despublicar esconde de novo', async () => {
    const publishResponse = await publish(buildRequest('POST', undefined, adminToken))
    const publishedJson = await publishResponse.json()

    expect(publishResponse.status).toBe(200)
    expect(publishedJson.profile.status).toBe('PUBLISHED')

    const publicAfterPublish = await getAgencyPublic(
      new NextRequest(`http://localhost/api/marketplace/agencies/${tenantId}`),
      { params: Promise.resolve({ id: tenantId }) },
    )
    const publicJson = await publicAfterPublish.json()

    expect(publicAfterPublish.status).toBe(200)
    expect(publicJson.agency.displayName).toBe('Imobiliária Perfil Agência')
    expect(publicJson.agency.team).toHaveLength(1)
    expect(publicJson.agency.stats.brokersCount).toBeGreaterThanOrEqual(2)

    const unpublishResponse = await unpublish(buildRequest('POST', undefined, adminToken))
    expect(unpublishResponse.status).toBe(200)

    const publicAfterUnpublish = await getAgencyPublic(
      new NextRequest(`http://localhost/api/marketplace/agencies/${tenantId}`),
      { params: Promise.resolve({ id: tenantId }) },
    )
    expect(publicAfterUnpublish.status).toBe(404)
  })

  it('publish retorna 422 quando faltam campos obrigatórios', async () => {
    const bareTenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Incompleta', slug: `perfil-agencia-incompleta-${randomUUID()}` },
    })
    const bareAdmin = await prisma.user.create({
      data: {
        tenantId: bareTenant.id,
        name: 'Admin Incompleto',
        email: `admin-incompleto-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    const bareAdminToken = await tokenService.sign({
      id: bareAdmin.id,
      tenantId: bareAdmin.tenantId,
      name: bareAdmin.name,
      email: bareAdmin.email,
      role: bareAdmin.role,
      active: bareAdmin.active,
      membershipApprovedAt: bareAdmin.membershipApprovedAt,
    })

    await PUT(
      buildRequest(
        'PUT',
        { displayName: 'Imobiliária Incompleta', coverage: [], segments: [], team: [] },
        bareAdminToken,
      ),
    )

    const response = await publish(buildRequest('POST', undefined, bareAdminToken))

    expect(response.status).toBe(422)

    await prisma.tenant.delete({ where: { id: bareTenant.id } })
  })
})
