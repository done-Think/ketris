import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../stats/route'

describe('GET /api/marketplace/stats (integração)', () => {
  let tenantId: string
  const city = `Cidade ${randomUUID().slice(0, 8)}`

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
            city,
            state: 'PR',
            zipCode: '80010-000',
          },
        },
      },
    })
    for (const status of ['PUBLISHED', 'DRAFT'] as const) {
      await prisma.property.create({
        data: {
          tenantId,
          responsibleId: agent.id,
          title: 'Imóvel de sugestões',
          purpose: 'SALE',
          type: 'HOUSE',
          price: 450000,
          status,
          address: {
            create: {
              street: 'Rua das sugestões',
              number: '2',
              neighborhood: status === 'PUBLISHED' ? 'Centro' : 'Bairro privado',
              city,
              state: 'PR',
              zipCode: '80010-000',
            },
          },
        },
      })
    }
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
      'locations',
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

  it('suggests only actual published locations without duplicate neighborhoods', async () => {
    const response = await GET()
    const { locations } = await response.json()
    expect(locations.filter((location: string) => location === `Centro, ${city}`)).toHaveLength(1)
    expect(locations).not.toContain(`Bairro privado, ${city}`)
    expect(locations.length).toBeLessThanOrEqual(20)
  })

  it('returns the 20 most frequent locations out of 30, with deterministic order', async () => {
    const user = await prisma.user.findFirstOrThrow({ where: { tenantId } })
    const properties = Array.from({ length: 30 }, (_, index) =>
      Array.from({ length: 100 + index }, () => ({
        id: randomUUID(),
        tenantId,
        responsibleId: user.id,
        title: 'Ranked location',
        purpose: 'SALE' as const,
        type: 'HOUSE' as const,
        price: 1,
        status: 'PUBLISHED' as const,
        neighborhood: `Rank ${String(index).padStart(2, '0')}`,
      })),
    ).flat()
    await prisma.property.createMany({
      data: properties.map(({ neighborhood: _neighborhood, ...property }) => property),
    })
    await prisma.propertyAddress.createMany({
      data: properties.map((property) => ({
        tenantId,
        propertyId: property.id,
        street: 'Ranking',
        number: '1',
        neighborhood: property.neighborhood,
        city,
        state: 'PR',
        zipCode: '80000-000',
      })),
    })
    const { locations } = await (await GET()).json()
    expect(locations).toEqual(
      Array.from(
        { length: 20 },
        (_, index) => `Rank ${String(29 - index).padStart(2, '0')}, ${city}`,
      ),
    )
  })
})
