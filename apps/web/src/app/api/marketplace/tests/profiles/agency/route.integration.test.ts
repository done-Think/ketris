import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { PrismaAgencyProfileRepository } from '@server/marketplace/infrastructure/prisma-agency-profile.repository'

import { GET as getAgencyPublic } from '../../../agencies/[id]/route'
import { GET as listAgencies } from '../../../agencies/route'
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
  let ownerId: string
  let ownerEmail: string
  let ownerAvatarUrl: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Imobiliária Perfil Agência',
        slug: `perfil-agencia-${randomUUID()}`,
        primaryColor: '#112233',
        secondaryColor: '#445566',
      },
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
        phone: '35997989991',
        creci: 'MG-12345-J',
      },
    })
    ownerId = admin.id
    ownerEmail = admin.email
    ownerAvatarUrl = `/api/auth/media/avatars/${tenantId}/${ownerId}/logo.png`
    await prisma.user.update({ where: { id: ownerId }, data: { avatarUrl: ownerAvatarUrl } })
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

  it('prefills a new draft from the verified account without saving or publishing it', async () => {
    const response = await GET(buildRequest('GET', undefined, adminToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.profile).toMatchObject({
      id: tenantId,
      displayName: 'Imobiliária Perfil Agência',
      email: ownerEmail,
      phone: '35997989991',
      logoUrl: ownerAvatarUrl,
      legalCreci: 'MG-12345-J',
      status: 'DRAFT',
      primaryColor: '#112233',
      secondaryColor: '#445566',
    })
    expect(await prisma.agencyPublicProfile.findUnique({ where: { tenantId } })).toBeNull()
    const publicResponse = await getAgencyPublic(
      new NextRequest(`http://localhost/api/marketplace/agencies/${tenantId}`),
      { params: Promise.resolve({ id: tenantId }) },
    )
    expect(publicResponse.status).toBe(404)
  })

  it('fills missing fields in an existing draft without changing the saved profile', async () => {
    await prisma.agencyPublicProfile.create({
      data: { tenantId, displayName: 'Nome personalizado' },
    })
    try {
      const response = await GET(buildRequest('GET', undefined, adminToken))
      expect((await response.json()).profile).toMatchObject({
        displayName: 'Nome personalizado',
        email: ownerEmail,
        phone: '35997989991',
        logoUrl: ownerAvatarUrl,
        legalCreci: 'MG-12345-J',
      })
      expect(await prisma.agencyPublicProfile.findUnique({ where: { tenantId } })).toMatchObject({
        phone: null,
        email: null,
        logoUrl: null,
        legalCreci: null,
      })
    } finally {
      await prisma.agencyPublicProfile.delete({ where: { tenantId } })
    }
  })

  it('does not reuse another tenant account or an unverified email', async () => {
    const repository = new PrismaAgencyProfileRepository()
    expect(await repository.findForEditor(tenantId, otherTenantAgentId)).toBeNull()
    await prisma.user.update({ where: { id: ownerId }, data: { emailVerifiedAt: null } })
    try {
      expect((await repository.findForEditor(tenantId, ownerId))?.email).toBeNull()
    } finally {
      await prisma.user.update({ where: { id: ownerId }, data: { emailVerifiedAt: new Date() } })
    }
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
          email: 'contato-publico@example.com',
          coverage: ['Zona Sul', 'Zona Oeste'],
          segments: ['Residencial', 'Comercial'],
          yearsInMarket: 15,
          backgroundColor: '#ffffff',
          primaryColor: '#123456',
          secondaryColor: '#654321',
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

  it('preserves the public contact and logo when they differ from account settings', async () => {
    const response = await GET(buildRequest('GET', undefined, adminToken))
    expect((await response.json()).profile).toMatchObject({
      phone: '(11) 90000-0000',
      email: 'contato-publico@example.com',
      logoUrl: 'https://cdn.ketris.com.br/logo.jpg',
      legalCreci: 'SP-654321',
    })
    expect(await prisma.user.findUnique({ where: { id: ownerId } })).toMatchObject({
      email: ownerEmail,
      phone: '35997989991',
      avatarUrl: ownerAvatarUrl,
    })
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
    expect(publicJson.agency).toMatchObject({
      primaryColor: '#123456',
      secondaryColor: '#654321',
      backgroundColor: '#ffffff',
    })
    expect(await prisma.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({
      primaryColor: '#112233',
      secondaryColor: '#445566',
    })
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

  it('preserves saved colors when an older client omits them', async () => {
    const response = await PUT(
      buildRequest(
        'PUT',
        { displayName: 'Imobiliária Perfil Agência', coverage: [], segments: [], team: [] },
        adminToken,
      ),
    )
    expect(response.status).toBe(200)
    expect((await response.json()).profile).toMatchObject({
      primaryColor: '#123456',
      secondaryColor: '#654321',
    })
  })

  it('rejects invalid profile colors without altering the saved palette', async () => {
    const response = await PUT(
      buildRequest('PUT', { displayName: 'Agency', primaryColor: 'invalid' }, adminToken),
    )
    expect(response.status).toBe(400)
    expect(await prisma.agencyPublicProfile.findUnique({ where: { tenantId } })).toMatchObject({
      primaryColor: '#123456',
      secondaryColor: '#654321',
    })
  })

  it('publishes an agency with no registered brokers and lists it publicly', async () => {
    const agency = await prisma.tenant.create({
      data: { name: `Agency without brokers ${randomUUID()}`, slug: `no-brokers-${randomUUID()}` },
    })
    try {
      const owner = await prisma.user.create({
        data: {
          tenantId: agency.id,
          name: 'Agency owner',
          email: `owner-${randomUUID()}@example.test`,
          passwordHash: 'unused',
          role: 'OWNER',
        },
      })
      const token = await tokenService.sign(owner)
      const saved = await PUT(
        buildRequest(
          'PUT',
          {
            displayName: agency.name,
            headline: 'Sua nova imobiliária',
            summary: 'Uma imobiliária sem corretores cadastrados.',
            legalCreci: 'MG-12345',
            headquarters: 'Itajubá',
            address: 'Rua Principal, 35',
            email: owner.email,
            coverage: ['Itajubá'],
            segments: ['Residencial'],
            yearsInMarket: 0,
            backgroundColor: '#ffffff',
            logoUrl: 'https://example.test/logo.png',
            bannerUrl: 'https://example.test/banner.png',
            team: [],
          },
          token,
        ),
      )
      expect(saved.status).toBe(200)
      const response = await publish(buildRequest('POST', undefined, token))
      expect(response.status).toBe(200)
      expect((await response.json()).profile).toMatchObject({ status: 'PUBLISHED', team: [] })

      const directory = await listAgencies(
        new NextRequest(
          `http://localhost/api/marketplace/agencies?q=${encodeURIComponent(agency.name)}`,
        ),
      )
      expect((await directory.json()).agencies).toEqual([
        expect.objectContaining({ id: agency.id, team: [] }),
      ])
    } finally {
      await prisma.tenant.delete({ where: { id: agency.id } })
    }
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
