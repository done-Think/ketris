import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../stats/route'

describe('GET /api/marketplace/stats (integração)', () => {
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Estatísticas', slug: `stats-${randomUUID()}` },
    })
    tenantId = tenant.id
    const agent = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor Estatísticas',
        email: `stats-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    await prisma.brokerPublicProfile.create({
      data: {
        userId: agent.id,
        displayName: 'Corretor Estatísticas',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    await prisma.property.create({
      data: {
        tenantId,
        responsibleId: agent.id,
        title: 'Casa estatísticas',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 450000,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        address: {
          create: {
            street: 'Rua Estatística',
            number: '1',
            neighborhood: 'Centro',
            city: `Cidade ${randomUUID().slice(0, 8)}`,
            state: 'PR',
            zipCode: '80010-000',
          },
        },
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('conta perfis, imóveis e cidades publicados sem manter cache de elegibilidade', async () => {
    const response = await GET()
    const stats = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(Object.keys(stats).sort()).toEqual([
      'publishedBrokers',
      'publishedProperties',
      'servedCities',
    ])
    expect(stats.publishedBrokers).toBeGreaterThanOrEqual(1)
    expect(stats.publishedProperties).toBeGreaterThanOrEqual(1)
    expect(stats.servedCities).toBeGreaterThanOrEqual(1)
    const published = await prisma.property.count({ where: { status: 'PUBLISHED' } })
    expect(stats.publishedProperties).toBeLessThanOrEqual(published)
  })
})
