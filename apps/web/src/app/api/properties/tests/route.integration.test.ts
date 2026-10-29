import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../route'
import { GET as listOwners } from '../owners/route'
import { GET as getProperty, PATCH } from '../[id]/route'

describe('/api/properties (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorId: string
  let actorToken: string
  let renterToken: string
  let otherAgentToken: string
  let adminToken: string
  let createdPropertyId: string
  let otherTenantPropertyId: string
  let otherAgentPropertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Properties', slug: `properties-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Other Properties', slug: `other-properties-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const actor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      active: actor.active,
      membershipApprovedAt: actor.membershipApprovedAt,
    })

    const renter = await prisma.user.create({
      data: {
        tenantId,
        name: 'Locatário Teste',
        email: `locatario-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'RENTER',
      },
    })
    renterToken = await tokenService.sign({
      id: renter.id,
      tenantId: renter.tenantId,
      name: renter.name,
      email: renter.email,
      role: renter.role,
      active: renter.active,
      membershipApprovedAt: renter.membershipApprovedAt,
    })

    const otherActor = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        name: 'Outro Corretor',
        email: `outro-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    const otherProperty = await prisma.property.create({
      data: {
        tenantId: otherTenantId,
        responsibleId: otherActor.id,
        title: 'Imóvel de outro tenant',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1800,
        status: 'DRAFT',
      },
    })
    otherTenantPropertyId = otherProperty.id

    const otherAgentSameTenant = await prisma.user.create({
      data: {
        tenantId,
        name: 'Outro Corretor da Mesma Imobiliária',
        email: `outro-corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    otherAgentToken = await tokenService.sign({
      id: otherAgentSameTenant.id,
      tenantId: otherAgentSameTenant.tenantId,
      name: otherAgentSameTenant.name,
      email: otherAgentSameTenant.email,
      role: otherAgentSameTenant.role,
      active: otherAgentSameTenant.active,
      membershipApprovedAt: otherAgentSameTenant.membershipApprovedAt,
    })
    const otherAgentProperty = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: otherAgentSameTenant.id,
        title: 'Imóvel de outro corretor da mesma imobiliária',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2200,
        status: 'DRAFT',
      },
    })
    otherAgentPropertyId = otherAgentProperty.id

    const admin = await prisma.user.create({
      data: {
        tenantId,
        name: 'Admin da Imobiliária',
        email: `admin-imobiliaria-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      active: admin.active,
      membershipApprovedAt: admin.membershipApprovedAt,
    })
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    if (otherTenantId) {
      await prisma.tenant.delete({ where: { id: otherTenantId } })
    }
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/properties', {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('cria imóvel em rascunho com endereço e mídias', async () => {
    const response = await POST(
      buildRequest(
        'POST',
        {
          title: 'Apartamento Batel',
          description: 'Pronto para morar',
          purpose: 'RENT',
          type: 'APARTMENT',
          listing: {
            amenities: ['FURNISHED'],
            negotiationTerms: 'A combinar',
            publishAfterReview: false,
            allowWhatsappContact: true,
            featured: false,
          },
          bedrooms: 2,
          bathrooms: 1,
          parkingSpots: 1,
          areaSqm: 65,
          price: 3000,
          condoFee: 500,
          propertyTax: 120,
          address: {
            street: 'Rua Buenos Aires',
            number: '123',
            neighborhood: 'Batel',
            city: 'Curitiba',
            state: 'PR',
            zipCode: '80250070',
          },
          media: [{ url: `/api/properties/media/properties/${tenantId}/photo.jpg` }],
        },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.property.tenantId).toBe(tenantId)
    expect(json.property.status).toBe('DRAFT')
    expect(json.property.address.city).toBe('Curitiba')
    expect(json.property.media).toHaveLength(1)
    expect(json.property.listing.amenities).toEqual(['FURNISHED'])
    createdPropertyId = json.property.id
  })

  it('persiste o anúncio e permite limpar suas opções sem publicar automaticamente', async () => {
    const listing = {
      amenities: ['FURNISHED', 'PET_FRIENDLY'],
      negotiationTerms: 'Caução de dois aluguéis',
      publishAfterReview: true,
      allowWhatsappContact: true,
      featured: true,
    }
    const context = { params: Promise.resolve({ id: createdPropertyId }) }
    const update = await PATCH(buildRequest('PATCH', { listing }, actorToken), context)
    expect(update.status).toBe(200)
    expect((await update.json()).property.listing).toEqual(listing)

    const read = await getProperty(buildRequest('GET', undefined, actorToken), context)
    const { property } = await read.json()
    expect(property.listing).toEqual(listing)
    expect(property.status).toBe('DRAFT')

    const priceUpdate = await PATCH(buildRequest('PATCH', { price: 3500 }, actorToken), context)
    expect((await priceUpdate.json()).property.listing).toEqual(listing)

    const cleared = {
      ...listing,
      amenities: [],
      negotiationTerms: null,
      publishAfterReview: false,
      allowWhatsappContact: false,
      featured: false,
    }
    const clear = await PATCH(buildRequest('PATCH', { listing: cleared }, actorToken), context)
    expect((await clear.json()).property.listing).toEqual(cleared)
  })

  it('lista apenas imóveis do tenant do ator', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(response.status).toBe(200)
    expect(ids).toContain(createdPropertyId)
    expect(ids).not.toContain(otherTenantPropertyId)
  })

  it('um corretor não vê imóveis de outro corretor da mesma imobiliária na listagem', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(createdPropertyId)
    expect(ids).not.toContain(otherAgentPropertyId)
  })

  it('o admin da imobiliária vê imóveis de todos os corretores do tenant', async () => {
    const response = await GET(buildRequest('GET', undefined, adminToken))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(createdPropertyId)
    expect(ids).toContain(otherAgentPropertyId)
  })

  it('cada corretor vê apenas o próprio imóvel na listagem', async () => {
    const response = await GET(buildRequest('GET', undefined, otherAgentToken))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(ids).toContain(otherAgentPropertyId)
    expect(ids).not.toContain(createdPropertyId)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('GET'))

    expect(response.status).toBe(401)
  })

  it('retorna 403 quando um RENTER tenta criar imóvel', async () => {
    const response = await POST(
      buildRequest(
        'POST',
        {
          title: 'Tentativa de locatário',
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 1000,
        },
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })
  it('pagina os resultados e mantém contagens no escopo autorizado', async () => {
    await prisma.property.createMany({
      data: Array.from({ length: 12 }, (_, index) => ({
        tenantId,
        responsibleId: actorId,
        title: `Page test ${index}`,
        purpose: 'RENT' as const,
        type: 'HOUSE' as const,
        price: 2000,
        status: index % 2 === 0 ? ('DRAFT' as const) : ('PUBLISHED' as const),
      })),
    })
    const requestPage = (page: number) =>
      GET(
        new NextRequest(
          `http://localhost/api/properties?search=Page%20test&page=${page}&pageSize=5`,
          { headers: { authorization: `Bearer ${actorToken}` } },
        ),
      )
    const first = await (await requestPage(1)).json()
    const second = await (await requestPage(2)).json()
    const last = await (await requestPage(3)).json()
    expect(first.pagination).toEqual({ page: 1, pageSize: 5, total: 12, totalPages: 3 })
    expect(first.properties).toHaveLength(5)
    expect(second.properties).toHaveLength(5)
    expect(last.properties).toHaveLength(2)
    const ids = [...first.properties, ...second.properties, ...last.properties].map(
      (item: { id: string }) => item.id,
    )
    expect(new Set(ids).size).toBe(12)
    expect(ids).not.toContain(otherTenantPropertyId)
    expect(ids).not.toContain(otherAgentPropertyId)
    expect(first.counts.DRAFT).toBeGreaterThanOrEqual(6)
    expect(first.counts.PUBLISHED).toBe(6)
    const filtered = await (
      await GET(
        new NextRequest(
          'http://localhost/api/properties?search=Page%20test&status=PUBLISHED&pageSize=5',
          { headers: { authorization: `Bearer ${actorToken}` } },
        ),
      )
    ).json()
    expect(filtered.pagination.total).toBe(6)
    expect(filtered.counts).toEqual(first.counts)
  })

  it.each(['page=0', 'pageSize=101'])('rejeita paginação inválida: %s', async (query) => {
    const response = await GET(
      new NextRequest(`http://localhost/api/properties?${query}`, {
        headers: { authorization: `Bearer ${actorToken}` },
      }),
    )
    expect(response.status).toBe(400)
  })

  it('permite apenas proprietários ativos do mesmo tenant e mantém o vínculo automático do proprietário', async () => {
    const owner = await prisma.user.create({
      data: {
        tenantId,
        name: 'Proprietário ativo',
        email: `owner-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'PROPERTY_OWNER',
      },
    })
    const inactive = await prisma.user.create({
      data: {
        tenantId,
        name: 'Proprietário inativo',
        email: `owner-inactive-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'PROPERTY_OWNER',
        active: false,
      },
    })
    const outsider = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        name: 'Outro tenant',
        email: `owner-other-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'PROPERTY_OWNER',
      },
    })
    const directory = await (await listOwners(buildRequest('GET', undefined, actorToken))).json()
    expect(directory.owners).toContainEqual({ id: owner.id, name: owner.name })
    expect(directory.owners.map((item: { id: string }) => item.id)).not.toContain(inactive.id)
    expect(directory.owners.map((item: { id: string }) => item.id)).not.toContain(outsider.id)
    const payload = {
      title: 'Imóvel com proprietário',
      type: 'HOUSE',
      purpose: 'RENT',
      price: 2000,
      ownerId: owner.id,
    }
    const created = await POST(buildRequest('POST', payload, actorToken))
    expect(created.status).toBe(201)
    const linkedProperty = (await created.json()).property
    expect(linkedProperty.ownerId).toBe(owner.id)
    for (const id of [inactive.id, outsider.id, actorId]) {
      const denied = await POST(buildRequest('POST', { ...payload, ownerId: id }, actorToken))
      expect(denied.status).toBe(400)
      expect((await denied.json()).error.code).toBe('PROPERTY_OWNER_INVALID')
      const update = await PATCH(buildRequest('PATCH', { ownerId: id }, actorToken), {
        params: Promise.resolve({ id: createdPropertyId }),
      })
      expect(update.status).toBe(400)
    }
    const ownerToken = await tokenService.sign({
      id: owner.id,
      tenantId,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      active: owner.active,
      membershipApprovedAt: owner.membershipApprovedAt,
    })
    const owned = await POST(buildRequest('POST', { ...payload, ownerId: outsider.id }, ownerToken))
    expect(owned.status).toBe(201)
    expect((await owned.json()).property.ownerId).toBe(owner.id)
    expect((await listOwners(buildRequest('GET', undefined, ownerToken))).status).toBe(403)
    expect((await listOwners(buildRequest('GET', undefined, renterToken))).status).toBe(403)
    await prisma.user.update({ where: { id: owner.id }, data: { active: false } })
    const historicalLink = await PATCH(
      buildRequest('PATCH', { title: 'Título atualizado', ownerId: owner.id }, actorToken),
      { params: Promise.resolve({ id: linkedProperty.id }) },
    )
    expect(historicalLink.status).toBe(200)
    expect((await historicalLink.json()).property.ownerId).toBe(owner.id)
    const newLink = await PATCH(buildRequest('PATCH', { ownerId: owner.id }, actorToken), {
      params: Promise.resolve({ id: createdPropertyId }),
    })
    expect(newLink.status).toBe(400)
  })

  it('ordena valores de venda e aluguel sobre todo o resultado, antes da paginação', async () => {
    const variants = [
      { purpose: 'RENT' as const, price: 1000, rentalPrice: null },
      { purpose: 'SALE' as const, price: 300000, rentalPrice: null },
      { purpose: 'BOTH' as const, price: 500000, rentalPrice: 1500 },
      { purpose: 'RENT' as const, price: 2000, rentalPrice: null },
      { purpose: 'SALE' as const, price: 250000, rentalPrice: null },
    ]
    const ids: string[] = []
    for (const [index, values] of variants.entries()) {
      ids.push(
        (
          await prisma.property.create({
            data: {
              ...values,
              tenantId,
              responsibleId: actorId,
              type: 'HOUSE',
              title: `Price sort ${index}`,
            },
          })
        ).id,
      )
    }
    const sorted = async (sortBy: string, page: number, pageSize: number) =>
      (
        await GET(
          new NextRequest(
            `http://localhost/api/properties?search=Price%20sort&sortBy=${sortBy}&sortOrder=asc&page=${page}&pageSize=${pageSize}`,
            { headers: { authorization: `Bearer ${actorToken}` } },
          ),
        )
      ).json()
    const rent = await sorted('rentalValue', 1, 2)
    expect(rent.pagination.total).toBe(5)
    expect(rent.properties.map((item: { id: string }) => item.id)).toEqual([ids[0], ids[2]])
    const second = await sorted('rentalValue', 2, 2)
    expect(second.properties[0].id).toBe(ids[3])
    const sale = await sorted('saleValue', 1, 5)
    expect(sale.properties.slice(0, 3).map((item: { id: string }) => item.id)).toEqual([
      ids[4],
      ids[1],
      ids[2],
    ])
    const byTitle = await sorted('title', 1, 2)
    expect(byTitle.properties.map((item: { id: string }) => item.id)).toEqual([ids[0], ids[1]])
  })
  it.each([
    [
      'pt-BR',
      ['APARTMENT', 'HOUSE', 'PENTHOUSE', 'COMMERCIAL', 'LOFT', 'OTHER', 'STUDIO'],
      ['RENTED', 'PUBLISHED', 'DRAFT', 'INACTIVE', 'SOLD'],
    ],
    [
      'en-US',
      ['APARTMENT', 'COMMERCIAL', 'HOUSE', 'LOFT', 'OTHER', 'PENTHOUSE', 'STUDIO'],
      ['PUBLISHED', 'INACTIVE', 'RENTED', 'SOLD', 'DRAFT'],
    ],
    [
      'es-ES',
      ['APARTMENT', 'PENTHOUSE', 'HOUSE', 'COMMERCIAL', 'LOFT', 'OTHER', 'STUDIO'],
      ['RENTED', 'PUBLISHED', 'DRAFT', 'INACTIVE', 'SOLD'],
    ],
  ] as const)(
    'ordena rótulos em %s antes de paginar e mantém o isolamento por tenant',
    async (locale, typeOrder, statusOrder) => {
      const prefix = `Labels-${locale}-${randomUUID()}`
      const types = [
        'STUDIO',
        'HOUSE',
        'PENTHOUSE',
        'OTHER',
        'APARTMENT',
        'COMMERCIAL',
        'LOFT',
      ] as const
      const ids = new Map<string, string>()
      for (const type of types) {
        const row = await prisma.property.create({
          data: {
            tenantId,
            responsibleId: actorId,
            title: `${prefix}-types`,
            purpose: 'RENT',
            type,
            price: 1000,
          },
        })
        ids.set(type, row.id)
      }
      const foreign = await prisma.property.findUniqueOrThrow({
        where: { id: otherTenantPropertyId },
        select: { responsibleId: true },
      })
      await prisma.property.create({
        data: {
          tenantId: otherTenantId,
          responsibleId: foreign.responsibleId,
          title: `${prefix}-types`,
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 1000,
        },
      })
      const read = async (
        part: string,
        sortBy: string,
        page: number,
        size: number,
        direction = 'asc',
        status?: string,
      ) => {
        const response = await GET(
          new NextRequest(
            `http://localhost/api/properties?search=${prefix}-${part}&locale=${locale}&sortBy=${sortBy}&sortOrder=${direction}&page=${page}&pageSize=${size}${status ? `&status=${status}` : ''}`,
            { headers: { authorization: `Bearer ${adminToken}` } },
          ),
        )
        expect(response.status).toBe(200)
        return response.json()
      }
      const all = await read('types', 'type', 1, 25)
      expect(all.pagination.total).toBe(7)
      expect(all.properties.map((property: { id: string }) => property.id)).toEqual(
        typeOrder.map((type) => ids.get(type)),
      )
      const second = await read('types', 'type', 2, 2)
      expect(second.properties.map((property: { id: string }) => property.id)).toEqual(
        typeOrder.slice(2, 4).map((type) => ids.get(type)),
      )
      const descending = await read('types', 'type', 2, 2, 'desc')
      expect(descending.properties.map((property: { id: string }) => property.id)).toEqual(
        [...typeOrder]
          .reverse()
          .slice(2, 4)
          .map((type) => ids.get(type)),
      )
      const statuses = ['SOLD', 'DRAFT', 'RENTED', 'INACTIVE', 'PUBLISHED'] as const
      const statusIds = new Map<string, string>()
      for (const status of statuses) {
        const row = await prisma.property.create({
          data: {
            tenantId,
            responsibleId: actorId,
            title: `${prefix}-statuses`,
            purpose: 'RENT',
            type: 'HOUSE',
            price: 1000,
            status,
          },
        })
        statusIds.set(status, row.id)
      }
      const statusAll = await read('statuses', 'status', 1, 25)
      expect(statusAll.properties.map((property: { status: string }) => property.status)).toEqual(
        statusOrder,
      )
      const filteredPrice = await read('statuses', 'rentalValue', 1, 25, 'asc', 'DRAFT')
      expect(filteredPrice.pagination.total).toBe(1)
      expect(filteredPrice.properties.map((property: { id: string }) => property.id)).toEqual([
        statusIds.get('DRAFT'),
      ])
      const statusPage = await read('statuses', 'status', 2, 2)
      expect(statusPage.pagination.total).toBe(5)
      expect(statusPage.properties.map((property: { id: string }) => property.id)).toEqual(
        statusOrder.slice(2, 4).map((status) => statusIds.get(status)),
      )
    },
  )

  it('rejeita um idioma desconhecido na ordenação', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/properties?locale=invalid&sortBy=type', {
        headers: { authorization: `Bearer ${actorToken}` },
      }),
    )
    expect(response.status).toBe(400)
  })
})
