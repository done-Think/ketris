import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../brokers/route'

const marker = randomUUID().slice(0, 8)

function request(search = '') {
  return new NextRequest(`http://localhost/api/marketplace/brokers${search}`)
}

describe('GET /api/marketplace/brokers (integração)', () => {
  let tenantId: string
  let publishedAgentId: string
  let draftAgentId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Diretório', slug: `diretorio-corretores-${randomUUID()}` },
    })
    tenantId = tenant.id

    const publishedAgent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretora Publicada',
        email: `publicada-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    publishedAgentId = publishedAgent.id
    await prisma.brokerPublicProfile.create({
      data: {
        userId: publishedAgentId,
        displayName: `Corretora Publicada ${marker}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    const draftAgent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor Rascunho',
        email: `rascunho-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    draftAgentId = draftAgent.id
    await prisma.brokerPublicProfile.create({
      data: { userId: draftAgentId, displayName: 'Corretor Rascunho', status: 'DRAFT' },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('lista só perfis publicados e devolve a paginação', async () => {
    const response = await GET(request(`?q=${marker}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    const ids = json.brokers.map((item: { id: string }) => item.id)
    expect(ids).toEqual([publishedAgentId])
    expect(ids).not.toContain(draftAgentId)
    expect(json).toMatchObject({ totalCount: 1, page: 1, pageSize: 12 })
  })

  it('busca sem diferenciar acentos e maiúsculas', async () => {
    const response = await GET(request(`?q=${encodeURIComponent('CORRETORA PUBLICADA ' + marker)}`))
    const json = await response.json()

    expect(json.brokers.map((item: { id: string }) => item.id)).toEqual([publishedAgentId])
  })

  it('rejeita parâmetros desconhecidos ou fora do limite', async () => {
    expect((await GET(request('?pageSize=500'))).status).toBe(400)
    expect((await GET(request('?foo=1'))).status).toBe(400)
  })
})
