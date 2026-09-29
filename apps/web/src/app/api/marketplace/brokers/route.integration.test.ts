import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from './route'

describe('GET /api/marketplace/brokers (integração)', () => {
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
      data: { usuarioId: draftAgentId, displayName: 'Corretor Rascunho', status: 'DRAFT' },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('lista só corretores com perfil publicado', async () => {
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    const ids = json.brokers.map((broker: { id: string }) => broker.id)
    expect(ids).toContain(publishedAgentId)
    expect(ids).not.toContain(draftAgentId)
  })
})
