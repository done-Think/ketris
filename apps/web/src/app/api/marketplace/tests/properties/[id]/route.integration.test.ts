import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../../properties/[id]/route'

describe('GET /api/marketplace/properties/[id] (integração)', () => {
  let tenantId: string
  let publishedId: string
  let draftId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Detalhe', slug: `mkt-detail-${randomUUID()}` },
    })
    tenantId = tenant.id

    const responsible = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })

    const published = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: responsible.id,
        title: 'Casa publicada',
        description: 'Casa ampla com quintal',
        purpose: 'SALE',
        type: 'HOUSE',
        bedrooms: 3,
        price: 550000,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        address: {
          create: {
            street: 'Rua B',
            number: '20',
            neighborhood: 'Jardim',
            city: 'Curitiba',
            state: 'PR',
            zipCode: '80010-000',
          },
        },
        media: {
          create: [
            { url: 'https://cdn.ketris.dev/2.jpg', type: 'PHOTO', position: 1 },
            { url: 'https://cdn.ketris.dev/1.jpg', type: 'PHOTO', position: 0 },
          ],
        },
      },
    })
    publishedId = published.id

    const draft = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: responsible.id,
        title: 'Casa em rascunho',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 600000,
        status: 'DRAFT',
      },
    })
    draftId = draft.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(id: string): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace/properties/${id}`)
  }

  it('retorna 200 com o detalhe do imóvel publicado, endereço e mídias ordenadas', async () => {
    const response = await GET(buildRequest(publishedId), {
      params: Promise.resolve({ id: publishedId }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.id).toBe(publishedId)
    expect(json.property).not.toHaveProperty('tenantId')
    expect(json.property.address.city).toBe('Curitiba')
    expect(json.property.media.map((m: { order: number }) => m.order)).toEqual([0, 1])
    expect(json.property.coverUrl).toBe('https://cdn.ketris.dev/1.jpg')
  })

  it('retorna 404 para um imóvel em rascunho (não publicado)', async () => {
    const response = await GET(buildRequest(draftId), { params: Promise.resolve({ id: draftId }) })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('PROPERTY_NOT_FOUND')
  })

  it('retorna 404 para um id inexistente', async () => {
    const response = await GET(buildRequest('inexistente'), {
      params: Promise.resolve({ id: 'inexistente' }),
    })

    expect(response.status).toBe(404)
  })
})
