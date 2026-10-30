import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { GET } from '../../properties/route'

describe('marketplace purpose and transaction price', () => {
  const city = `Purpose-${randomUUID()}`
  let tenantId: string
  const ids: Record<string, string> = {}

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { name: city, slug: city.toLowerCase() } })
    tenantId = tenant.id
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'Test',
        email: `${randomUUID()}@example.test`,
        passwordHash: 'test-only',
        role: 'OWNER',
      },
    })
    for (const [name, purpose, price, rentalPrice] of [
      ['rent', 'RENT', 3500, null],
      ['sale', 'SALE', 650000, null],
      ['both', 'BOTH', 900000, 2500],
      ['legacy', 'BOTH', 800000, null],
    ] as const) {
      const property = await prisma.property.create({
        data: {
          tenantId,
          responsibleId: user.id,
          title: name,
          purpose,
          price,
          rentalPrice,
          type: 'HOUSE',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          address: {
            create: {
              street: 'Street',
              number: '1',
              neighborhood: 'Centre',
              city,
              state: 'PR',
              zipCode: '80000000',
            },
          },
        },
      })
      ids[name] = property.id
    }
  })
  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
  })

  async function search(filters: Record<string, string>) {
    const response = await GET(
      new NextRequest(
        `http://localhost/api/marketplace/properties?${new URLSearchParams({ city, ...filters })}`,
      ),
    )
    expect(response.status).toBe(200)
    return response.json()
  }

  it('separates rentals and sales and includes dual listings with the applicable price', async () => {
    const rent = await search({ purpose: 'RENT' })
    expect(rent.properties.map((p: { id: string }) => p.id).sort()).toEqual(
      [ids.rent, ids.both].sort(),
    )
    expect(rent.properties.find((p: { id: string }) => p.id === ids.both)).toMatchObject({
      price: 900000,
      rentalPrice: 2500,
    })
    const sale = await search({ purpose: 'SALE' })
    expect(sale.properties.map((p: { id: string }) => p.id).sort()).toEqual(
      [ids.sale, ids.both, ids.legacy].sort(),
    )
  })

  it('filters by the rental amount instead of the sale price for BOTH', async () => {
    expect(
      (await search({ purpose: 'RENT', minPrice: '2000', maxPrice: '3000' })).properties.map(
        (p: { id: string }) => p.id,
      ),
    ).toEqual([ids.both])
    expect(
      (await search({ purpose: 'RENT', minPrice: '3000' })).properties.map(
        (p: { id: string }) => p.id,
      ),
    ).toEqual([ids.rent])
    expect((await search({ purpose: 'RENT', maxPrice: '0' })).totalCount).toBe(0)
  })

  it('accepts sale budgets above ten thousand', async () => {
    expect(
      (await search({ purpose: 'SALE', maxPrice: '750000' })).properties.map(
        (p: { id: string }) => p.id,
      ),
    ).toEqual([ids.sale])
    expect(
      (await search({ purpose: 'SALE', minPrice: '850000', maxPrice: '2000000' })).properties.map(
        (p: { id: string }) => p.id,
      ),
    ).toEqual([ids.both])
  })

  it.each(['priceAsc', 'priceDesc'] as const)(
    'orders %s by the transaction amount before pagination',
    async (sortBy) => {
      const expected = sortBy === 'priceAsc' ? [ids.both, ids.rent] : [ids.rent, ids.both]
      const actual: string[] = []
      for (let page = 1; page <= 2; page++) {
        const result = await search({ purpose: 'RENT', sortBy, page: String(page), pageSize: '1' })
        expect(result.totalCount).toBe(2)
        actual.push(...result.properties.map((p: { id: string }) => p.id))
      }
      expect(actual).toEqual(expected)
    },
  )
})
