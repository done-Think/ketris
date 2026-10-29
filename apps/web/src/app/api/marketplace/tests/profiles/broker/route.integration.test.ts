import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET as getBrokerPublic } from '../../../brokers/[id]/route'
import { GET, PUT } from '../../../profiles/broker/route'
import { POST as publish } from '../../../profiles/broker/publish/route'
import { POST as unpublish } from '../../../profiles/broker/unpublish/route'

describe('/api/marketplace/profiles/broker (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let agentId: string
  let agentToken: string
  let adminToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Perfil Corretor', slug: `perfil-corretor-${randomUUID()}` },
    })
    tenantId = tenant.id

    const agent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Marina Costa',
        email: `marina-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    agentId = agent.id
    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      active: agent.active,
      membershipApprovedAt: agent.membershipApprovedAt,
    })

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
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body: unknown, token: string): NextRequest {
    return new NextRequest('http://localhost/api/marketplace/profiles/broker', {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    })
  }

  it('GET retorna null quando o corretor ainda não criou o perfil', async () => {
    const response = await GET(buildRequest('GET', undefined, agentToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.profile).toBeNull()
  })

  it('PUT retorna 403 quando o ator não é AGENT', async () => {
    const response = await PUT(
      buildRequest('PUT', { displayName: 'Admin', neighborhoods: [], specialties: [] }, adminToken),
    )

    expect(response.status).toBe(403)
  })

  it('salva, publica e fica visível no diretório público; despublicar esconde de novo', async () => {
    const saveResponse = await PUT(
      buildRequest(
        'PUT',
        {
          displayName: 'Marina Costa',
          headline: 'Especialista em Jardins',
          bio: 'Corretora há 10 anos, focada em alto padrão.',
          creci: 'SP-123456',
          phone: '(11) 90000-0000',
          region: 'Zona Sul de São Paulo',
          neighborhoods: ['Jardins'],
          specialties: ['Alto padrão'],
          availability: 'Seg a sex, 9h às 18h',
          primaryColor: '#111111',
          secondaryColor: '#222222',
          backgroundColor: '#ffffff',
          avatarUrl: 'https://cdn.ketris.com.br/avatar.jpg',
          bannerUrl: 'https://cdn.ketris.com.br/banner.jpg',
        },
        agentToken,
      ),
    )
    const savedJson = await saveResponse.json()

    expect(saveResponse.status).toBe(200)
    expect(savedJson.profile.status).toBe('DRAFT')
    expect(savedJson.profile.displayName).toBe('Marina Costa')

    const publicBeforePublish = await getBrokerPublic(
      new NextRequest(`http://localhost/api/marketplace/brokers/${agentId}`),
      { params: Promise.resolve({ id: agentId }) },
    )
    expect(publicBeforePublish.status).toBe(404)

    const publishResponse = await publish(buildRequest('POST', undefined, agentToken))
    const publishedJson = await publishResponse.json()

    expect(publishResponse.status).toBe(200)
    expect(publishedJson.profile.status).toBe('PUBLISHED')

    const publicAfterPublish = await getBrokerPublic(
      new NextRequest(`http://localhost/api/marketplace/brokers/${agentId}`),
      { params: Promise.resolve({ id: agentId }) },
    )
    const publicJson = await publicAfterPublish.json()

    expect(publicAfterPublish.status).toBe(200)
    expect(publicJson.broker.displayName).toBe('Marina Costa')
    expect(publicJson.broker).not.toHaveProperty('tenantId')

    const unpublishResponse = await unpublish(buildRequest('POST', undefined, agentToken))
    expect(unpublishResponse.status).toBe(200)

    const publicAfterUnpublish = await getBrokerPublic(
      new NextRequest(`http://localhost/api/marketplace/brokers/${agentId}`),
      { params: Promise.resolve({ id: agentId }) },
    )
    expect(publicAfterUnpublish.status).toBe(404)
  })

  it('publish retorna 422 quando faltam campos obrigatórios', async () => {
    const otherAgent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Bruna Lima',
        email: `bruna-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    const otherAgentToken = await tokenService.sign({
      id: otherAgent.id,
      tenantId: otherAgent.tenantId,
      name: otherAgent.name,
      email: otherAgent.email,
      role: otherAgent.role,
      active: otherAgent.active,
      membershipApprovedAt: otherAgent.membershipApprovedAt,
    })

    await PUT(
      buildRequest(
        'PUT',
        { displayName: 'Bruna Lima', neighborhoods: [], specialties: [] },
        otherAgentToken,
      ),
    )

    const response = await publish(buildRequest('POST', undefined, otherAgentToken))

    expect(response.status).toBe(422)
  })
})
