import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../brokers/route'

describe('GET /api/marketplace/brokers (integração)', () => {
  const token = `bairro${randomUUID().slice(0, 8)}`
  let tenantId: string
  let publishedAgentId: string
  let draftAgentId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Diretório', slug: `diretorio-corretores-${randomUUID()}` },
    })
    tenantId = tenant.id

    const publishedAgent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretora Publicada',
        email: `publicada-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    publishedAgentId = publishedAgent.id
    await prisma.perfilPublicoCorretor.create({
      data: {
        usuarioId: publishedAgentId,
        displayName: 'Corretora Publicada',
        bairros: [`Jardim Paulistânia ${token}`],
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })

    const draftAgent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Rascunho',
        email: `rascunho-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    draftAgentId = draftAgent.id
    await prisma.perfilPublicoCorretor.create({
      data: {
        usuarioId: draftAgentId,
        displayName: 'Corretor Rascunho',
        bairros: [`Jardim Paulistânia ${token}`],
        status: 'DRAFT',
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('lista só corretores publicados, buscando sem diferenciar acentos', async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/marketplace/brokers?q=paulistania ${token}`),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.brokers.map((broker: { id: string }) => broker.id)).toEqual([publishedAgentId])
    expect(json).toMatchObject({ totalCount: 1, page: 1, pageSize: 12 })
    expect(json.brokers[0]).not.toHaveProperty('tenantId')
  })
})
