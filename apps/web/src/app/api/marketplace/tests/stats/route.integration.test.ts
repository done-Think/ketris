import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../stats/route'

describe('GET /api/marketplace/stats (integração)', () => {
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Estatísticas', slug: `stats-${randomUUID()}` },
    })
    tenantId = tenant.id
    const agent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Estatísticas',
        email: `stats-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    await prisma.perfilPublicoCorretor.create({
      data: {
        usuarioId: agent.id,
        displayName: 'Corretor Estatísticas',
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })
    await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: agent.id,
        titulo: 'Casa estatísticas',
        finalidade: 'VENDA',
        tipo: 'CASA',
        valor: 450000,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
        endereco: {
          create: {
            logradouro: 'Rua Estatística',
            numero: '1',
            bairro: 'Centro',
            cidade: `Cidade ${randomUUID().slice(0, 8)}`,
            estado: 'PR',
            cep: '80010-000',
          },
        },
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('conta perfis, imóveis e cidades publicados e responde com cache público', async () => {
    const response = await GET()
    const stats = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=300')
    expect(Object.keys(stats).sort()).toEqual([
      'publishedBrokers',
      'publishedProperties',
      'servedCities',
    ])
    expect(stats.publishedBrokers).toBeGreaterThanOrEqual(1)
    expect(stats.publishedProperties).toBeGreaterThanOrEqual(1)
    expect(stats.servedCities).toBeGreaterThanOrEqual(1)
    const published = await prisma.imovel.count({ where: { status: 'PUBLISHED' } })
    expect(stats.publishedProperties).toBeLessThanOrEqual(published)
  })
})
