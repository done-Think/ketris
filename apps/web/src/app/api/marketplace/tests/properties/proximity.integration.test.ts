import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { GET } from '../../properties/route'

describe('public property proximity ordering', () => {
  const prefix = `geo-${randomUUID()}`
  let tenantId: string
  const ids: string[] = []
  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { name: prefix, slug: prefix } })
    tenantId = tenant.id
    const owner = await prisma.user.create({
      data: {
        tenantId,
        name: 'Owner',
        email: `${prefix}@example.test`,
        passwordHash: 'unused',
        role: 'OWNER',
      },
    })
    const points = [
      [-22.425, -45.453],
      [-22.23, -45.935],
      [-23.55, -46.63],
      [0, 0],
      [null, null],
    ]
    for (const [index, [latitude, longitude]] of points.entries()) {
      const property = await prisma.property.create({
        data: {
          tenantId,
          responsibleId: owner.id,
          title: `${prefix}-${index}`,
          purpose: 'BOTH',
          type: 'HOUSE',
          price: 500000 - index * 10000,
          rentalPrice: 3500 - index * 100,
          status: 'PUBLISHED',
          publishedAt: new Date(2020, 0, index + 1),
          address: {
            create: {
              street: 'Street',
              number: '1',
              neighborhood: 'Center',
              city: prefix,
              state: 'MG',
              zipCode: '37500000',
              latitude,
              longitude,
            },
          },
        },
      })
      ids.push(property.id)
    }
  })
  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
  })
  async function search(extra: Record<string, string> = {}) {
    const response = await GET(
      new NextRequest(
        `http://localhost/api/marketplace/properties?${new URLSearchParams({ q: prefix, latitude: '-22.425', longitude: '-45.453', ...extra })}`,
      ),
    )
    expect(response.status).toBe(200)
    return response.json()
  }
  it.each(['SALE', 'RENT'])(
    'sorts all %s matches by distance before pagination, with missing coordinates last',
    async (purpose) => {
      const collected: string[] = []
      for (let page = 1; page <= 3; page++) {
        const result = await search({ purpose, pageSize: '2', page: String(page) })
        expect(result.totalCount).toBe(5)
        collected.push(...result.properties.map((p: { id: string }) => p.id))
      }
      expect(collected).toEqual(ids)
    },
  )
  it('honors explicit price or recent ordering', async () => {
    for (const sortBy of ['priceAsc', 'recent']) {
      const result = await search({ sortBy })
      expect(result.properties.map((p: { id: string }) => p.id)).toEqual([...ids].reverse())
    }
  })
  it('uses zero coordinates as a real location', async () => {
    const result = await search({ latitude: '0', longitude: '0', pageSize: '1' })
    expect(result.properties[0].id).toBe(ids[3])
  })
  it('rejects a missing coordinate without breaking normal searches', async () => {
    const invalid = await GET(
      new NextRequest('http://localhost/api/marketplace/properties?latitude=-22'),
    )
    expect(invalid.status).toBe(400)
    const response = await GET(
      new NextRequest(`http://localhost/api/marketplace/properties?q=${prefix}`),
    )
    expect((await response.json()).properties.map((p: { id: string }) => p.id)).toEqual(
      [...ids].reverse(),
    )
  })
})
