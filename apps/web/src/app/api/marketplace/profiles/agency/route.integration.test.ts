import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET as getAgencyPublic } from '../../agencies/[id]/route'
import { GET, PUT } from './route'
import { POST as publish } from './publish/route'
import { POST as unpublish } from './unpublish/route'

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
      data: { nome: 'Imobiliária Perfil Agência', slug: `perfil-agencia-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `perfil-agencia-outra-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const admin = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin da Imobiliária',
        email: `admin-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      nome: admin.nome,
      email: admin.email,
      papel: admin.papel,
      ativo: admin.ativo,
      vinculoAprovadoEm: admin.vinculoAprovadoEm,
    })

    const agent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Camila Rocha',
        email: `camila-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    teamAgentId = agent.id
    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      nome: agent.nome,
      email: agent.email,
      papel: agent.papel,
      ativo: agent.ativo,
      vinculoAprovadoEm: agent.vinculoAprovadoEm,
    })

    const otherTenantAgent = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Corretor de Outro Tenant',
        email: `outro-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
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

  it('PUT retorna 403 quando o ator é AGENT (não ADMIN/OWNER)', async () => {
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
          summary: 'A imobiliária mais completa da cidade.',
          phone: '(11) 90000-0000',
          coverage: [],
          segments: [],
          team: [
            { usuarioId: teamAgentId, order: 0 },
            { usuarioId: otherTenantAgentId, order: 1 },
          ],
        },
        adminToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    const teamIds = json.profile.team.map((member: { usuarioId: string }) => member.usuarioId)
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
      data: { nome: 'Imobiliária Incompleta', slug: `perfil-agencia-incompleta-${randomUUID()}` },
    })
    const bareAdmin = await prisma.usuario.create({
      data: {
        tenantId: bareTenant.id,
        nome: 'Admin Incompleto',
        email: `admin-incompleto-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
    const bareAdminToken = await tokenService.sign({
      id: bareAdmin.id,
      tenantId: bareAdmin.tenantId,
      nome: bareAdmin.nome,
      email: bareAdmin.email,
      papel: bareAdmin.papel,
      ativo: bareAdmin.ativo,
      vinculoAprovadoEm: bareAdmin.vinculoAprovadoEm,
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
