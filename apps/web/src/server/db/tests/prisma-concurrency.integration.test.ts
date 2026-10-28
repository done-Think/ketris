import { randomUUID } from 'node:crypto'

import pg from 'pg'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { prisma } from '../prisma'

describe('PostgreSQL transaction concurrency', () => {
  let tenantId: string
  let propertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Transaction concurrency', slug: `concurrency-${randomUUID()}` },
    })
    tenantId = tenant.id
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'Concurrency fixture',
        email: `concurrency-${randomUUID()}@example.test`,
        passwordHash: 'not-used',
        role: 'AGENT',
      },
    })
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: user.id,
        title: 'Concurrent relation queries',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1000,
        address: {
          create: {
            street: 'Test Street',
            number: '1',
            neighborhood: 'Test',
            city: 'Test City',
            state: 'PR',
            zipCode: '80000-000',
          },
        },
        media: { create: { url: 'https://example.test/image.jpg', type: 'PHOTO', position: 0 } },
      },
    })
    propertyId = property.id
  })

  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('runs at most one query at a time on a transaction connection', async () => {
    const originalQuery = pg.Client.prototype.query
    const pending = new WeakMap<pg.Client, number>()
    let maximumPending = 0

    vi.spyOn(pg.Client.prototype, 'query').mockImplementation(function (this: pg.Client, ...args) {
      const count = (pending.get(this) ?? 0) + 1
      pending.set(this, count)
      maximumPending = Math.max(maximumPending, count)

      const finish = () => pending.set(this, (pending.get(this) ?? 1) - 1)
      const result: unknown = Reflect.apply(originalQuery, this, args)
      if (result instanceof Promise) return result.finally(finish)
      finish()
      return result
    })

    const [property, count] = await prisma.$transaction([
      prisma.property.findUniqueOrThrow({
        where: { id: propertyId },
        select: {
          id: true,
          address: { select: { city: true } },
          responsible: { select: { name: true } },
          media: { select: { url: true } },
        },
      }),
      prisma.property.count({ where: { id: propertyId } }),
    ])

    expect(property).toMatchObject({
      id: propertyId,
      address: { city: 'Test City' },
      responsible: { name: 'Concurrency fixture' },
      media: [{ url: 'https://example.test/image.jpg' }],
    })
    expect(count).toBe(1)
    expect(maximumPending).toBe(1)
  })

  it('propagates query errors and leaves the connection usable after rollback', async () => {
    await expect(
      prisma.$transaction((tx) =>
        Promise.all([
          tx.$queryRaw`SELECT 1 / 0 AS value`,
          tx.$queryRaw`SELECT 2 AS value`,
          tx.$queryRaw`SELECT 3 AS value`,
        ]),
      ),
    ).rejects.toMatchObject({ code: 'P2010' })

    await expect(prisma.$queryRaw`SELECT 4 AS value`).resolves.toEqual([{ value: 4 }])
  })
})
