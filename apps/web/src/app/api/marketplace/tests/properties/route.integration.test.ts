import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { generateOpenApiDocument } from '@server/openapi/registry'

import { GET } from '../../properties/route'

describe('GET /api/marketplace/properties (integração)', () => {
  let tenantId: string
  let responsibleId: string
  let publishedId: string
  let draftId: string
  let noParkingId: string
  const city = `Cidade-${randomUUID().slice(0, 8)}`
  const neighborhood = `Bairro-${randomUUID().slice(0, 8)}`

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Marketplace', slug: `mkt-${randomUUID()}` },
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
    responsibleId = responsible.id

    const published = await prisma.property.create({
      data: {
        tenantId,
        responsibleId,
        title: 'Apartamento publicado',
        purpose: 'RENT',
        type: 'APARTMENT',
        bedrooms: 2,
        parkingSpots: 1,
        areaSqm: 90,
        price: 2500,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        address: {
          create: {
            street: 'Rua A',
            number: '10',
            neighborhood,
            city,
            state: 'PR',
            zipCode: '80000-000',
          },
        },
        media: {
          create: [{ url: 'https://cdn.ketris.dev/capa.jpg', type: 'PHOTO', position: 0 }],
        },
      },
    })
    publishedId = published.id

    const draft = await prisma.property.create({
      data: {
        tenantId,
        responsibleId,
        title: 'Apartamento em rascunho',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 3000,
        status: 'DRAFT',
      },
    })
    draftId = draft.id

    const noParking = await prisma.property.create({
      data: {
        tenantId,
        responsibleId,
        title: 'Apartamento sem vaga',
        purpose: 'RENT',
        type: 'APARTMENT',
        parkingSpots: 0,
        areaSqm: 40,
        price: 1800,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        address: {
          create: {
            street: 'Rua B',
            number: '20',
            neighborhood,
            city: 'Outra Cidade',
            state: 'PR',
            zipCode: '80000-001',
          },
        },
      },
    })
    noParkingId = noParking.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(query = ''): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace/properties${query}`)
  }

  // Searches are scoped to this file's neighbourhood: the result is paginated and the database
  // holds published properties from other tests.
  it('retorna 200 e lista apenas imóveis publicados (rascunho não aparece)', async () => {
    const response = await GET(buildRequest(`?location=${neighborhood}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(publishedId)
    expect(ids).not.toContain(draftId)
  })

  it('não expõe o tenantId dos imóveis no resultado da busca', async () => {
    const response = await GET(buildRequest())
    const json = await response.json()

    for (const property of json.properties) {
      expect(property).not.toHaveProperty('tenantId')
    }
  })

  it('filtra por city (case-insensitive, match exato)', async () => {
    const response = await GET(buildRequest(`?city=${city.toLowerCase()}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(publishedId)
    expect(ids).not.toContain(noParkingId)
  })

  it('filtra por location (substring em bairro OU cidade)', async () => {
    const response = await GET(buildRequest(`?location=${neighborhood}`))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(publishedId)
    expect(ids).toContain(noParkingId)
  })

  it('filtra por faixa de preço (exclui imóveis fora do teto)', async () => {
    const response = await GET(buildRequest(`?location=${neighborhood}&maxPrice=1000`))
    const json = await response.json()

    expect(json.properties.some((property: { id: string }) => property.id === publishedId)).toBe(
      false,
    )
  })

  it('filtra por minArea', async () => {
    const response = await GET(buildRequest(`?location=${neighborhood}&minArea=80`))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(publishedId)
    expect(ids).not.toContain(noParkingId)
  })

  it('filtra por hasParking=true', async () => {
    const response = await GET(buildRequest(`?location=${neighborhood}&hasParking=true`))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(publishedId)
    expect(ids).not.toContain(noParkingId)
  })

  it('ordena por sortBy=priceAsc', async () => {
    const response = await GET(buildRequest(`?location=${neighborhood}&sortBy=priceAsc`))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids.indexOf(noParkingId)).toBeLessThan(ids.indexOf(publishedId))
  })

  it('pagina o resultado e informa o total que atende aos filtros', async () => {
    const pages = await Promise.all(
      [1, 2, 3].map(async (page) =>
        (
          await GET(
            buildRequest(`?location=${neighborhood}&sortBy=priceAsc&pageSize=1&page=${page}`),
          )
        ).json(),
      ),
    )

    expect(pages.map((page) => page.totalCount)).toEqual([2, 2, 2])
    expect(pages.map((page) => page.properties.map((p: { id: string }) => p.id))).toEqual([
      [noParkingId],
      [publishedId],
      [],
    ])
    expect(pages[0]).toMatchObject({ page: 1, pageSize: 1 })
    expect((await GET(buildRequest('?pageSize=51'))).status).toBe(400)
  })

  it('retorna 400 quando purpose é inválido', async () => {
    const response = await GET(buildRequest('?purpose=SEASONAL'))

    expect(response.status).toBe(400)
  })

  it('expõe as rotas públicas do marketplace no documento OpenAPI', () => {
    const document = generateOpenApiDocument()

    expect(document.paths['/marketplace/properties']).toBeDefined()
    expect(document.paths['/marketplace/properties/{id}']).toBeDefined()
    expect(document.paths['/marketplace/properties/{id}/inquiries']).toBeDefined()
  })
})
