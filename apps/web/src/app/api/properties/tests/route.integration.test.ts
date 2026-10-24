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
      data: { nome: 'Tenant Properties', slug: `properties-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Other Properties', slug: `other-properties-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
      vinculoAprovadoEm: actor.vinculoAprovadoEm,
    })

    const renter = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Locatário Teste',
        email: `locatario-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'RENTER',
      },
    })
    renterToken = await tokenService.sign({
      id: renter.id,
      tenantId: renter.tenantId,
      nome: renter.nome,
      email: renter.email,
      papel: renter.papel,
      ativo: renter.ativo,
      vinculoAprovadoEm: renter.vinculoAprovadoEm,
    })

    const otherActor = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Outro Corretor',
        email: `outro-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    const otherProperty = await prisma.imovel.create({
      data: {
        tenantId: otherTenantId,
        responsavelId: otherActor.id,
        titulo: 'Imóvel de outro tenant',
        finalidade: 'ALUGUEL',
        tipo: 'APARTAMENTO',
        valor: 1800,
        status: 'DRAFT',
      },
    })
    otherTenantPropertyId = otherProperty.id

    const otherAgentSameTenant = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Outro Corretor da Mesma Imobiliária',
        email: `outro-corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    otherAgentToken = await tokenService.sign({
      id: otherAgentSameTenant.id,
      tenantId: otherAgentSameTenant.tenantId,
      nome: otherAgentSameTenant.nome,
      email: otherAgentSameTenant.email,
      papel: otherAgentSameTenant.papel,
      ativo: otherAgentSameTenant.ativo,
      vinculoAprovadoEm: otherAgentSameTenant.vinculoAprovadoEm,
    })
    const otherAgentProperty = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: otherAgentSameTenant.id,
        titulo: 'Imóvel de outro corretor da mesma imobiliária',
        finalidade: 'ALUGUEL',
        tipo: 'APARTAMENTO',
        valor: 2200,
        status: 'DRAFT',
      },
    })
    otherAgentPropertyId = otherAgentProperty.id

    const admin = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin da Imobiliária',
        email: `admin-imobiliaria-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'OWNER',
      },
    })
    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      nome: admin.nome,
      email: admin.email,
      papel: admin.papel,
      ativo: admin.ativo,
      vinculoAprovadoEm: admin.vinculoAprovadoEm,
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
          titulo: 'Apartamento Batel',
          descricao: 'Pronto para morar',
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          anuncio: {
            comodidades: ['MOBILIADO'],
            condicoesNegociacao: 'A combinar',
            publicarAposRevisao: false,
            permiteContatoWhatsapp: true,
            destaque: false,
          },
          quartos: 2,
          banheiros: 1,
          vagas: 1,
          areaM2: 65,
          valor: 3000,
          condominio: 500,
          iptu: 120,
          endereco: {
            logradouro: 'Rua Buenos Aires',
            numero: '123',
            bairro: 'Batel',
            cidade: 'Curitiba',
            estado: 'PR',
            cep: '80250070',
          },
          midias: [{ url: `/api/properties/media/properties/${tenantId}/photo.jpg` }],
        },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.property.tenantId).toBe(tenantId)
    expect(json.property.status).toBe('DRAFT')
    expect(json.property.endereco.cidade).toBe('Curitiba')
    expect(json.property.midias).toHaveLength(1)
    expect(json.property.anuncio.comodidades).toEqual(['MOBILIADO'])
    createdPropertyId = json.property.id
  })

  it('persiste o anúncio e permite limpar suas opções sem publicar automaticamente', async () => {
    const anuncio = {
      comodidades: ['MOBILIADO', 'ACEITA_PETS'],
      condicoesNegociacao: 'Caução de dois aluguéis',
      publicarAposRevisao: true,
      permiteContatoWhatsapp: true,
      destaque: true,
    }
    const context = { params: Promise.resolve({ id: createdPropertyId }) }
    const update = await PATCH(buildRequest('PATCH', { anuncio }, actorToken), context)
    expect(update.status).toBe(200)
    expect((await update.json()).property.anuncio).toEqual(anuncio)

    const read = await getProperty(buildRequest('GET', undefined, actorToken), context)
    const { property } = await read.json()
    expect(property.anuncio).toEqual(anuncio)
    expect(property.status).toBe('DRAFT')

    const priceUpdate = await PATCH(buildRequest('PATCH', { valor: 3500 }, actorToken), context)
    expect((await priceUpdate.json()).property.anuncio).toEqual(anuncio)

    const cleared = {
      ...anuncio,
      comodidades: [],
      condicoesNegociacao: null,
      publicarAposRevisao: false,
      permiteContatoWhatsapp: false,
      destaque: false,
    }
    const clear = await PATCH(buildRequest('PATCH', { anuncio: cleared }, actorToken), context)
    expect((await clear.json()).property.anuncio).toEqual(cleared)
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
          titulo: 'Tentativa de locatário',
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor: 1000,
        },
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })
  it('pagina os resultados e mantém contagens no escopo autorizado', async () => {
    await prisma.imovel.createMany({
      data: Array.from({ length: 12 }, (_, index) => ({
        tenantId,
        responsavelId: actorId,
        titulo: `Page test ${index}`,
        finalidade: 'ALUGUEL' as const,
        tipo: 'CASA' as const,
        valor: 2000,
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
    const owner = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Proprietário ativo',
        email: `owner-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'PROPERTY_OWNER',
      },
    })
    const inactive = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Proprietário inativo',
        email: `owner-inactive-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'PROPERTY_OWNER',
        ativo: false,
      },
    })
    const outsider = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Outro tenant',
        email: `owner-other-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'PROPERTY_OWNER',
      },
    })
    const directory = await (await listOwners(buildRequest('GET', undefined, actorToken))).json()
    expect(directory.owners).toContainEqual({ id: owner.id, name: owner.nome })
    expect(directory.owners.map((item: { id: string }) => item.id)).not.toContain(inactive.id)
    expect(directory.owners.map((item: { id: string }) => item.id)).not.toContain(outsider.id)
    const payload = {
      titulo: 'Imóvel com proprietário',
      tipo: 'CASA',
      finalidade: 'ALUGUEL',
      valor: 2000,
      proprietarioId: owner.id,
    }
    const created = await POST(buildRequest('POST', payload, actorToken))
    expect(created.status).toBe(201)
    const linkedProperty = (await created.json()).property
    expect(linkedProperty.proprietarioId).toBe(owner.id)
    for (const id of [inactive.id, outsider.id, actorId]) {
      const denied = await POST(
        buildRequest('POST', { ...payload, proprietarioId: id }, actorToken),
      )
      expect(denied.status).toBe(400)
      expect((await denied.json()).error.code).toBe('PROPERTY_OWNER_INVALID')
      const update = await PATCH(buildRequest('PATCH', { proprietarioId: id }, actorToken), {
        params: Promise.resolve({ id: createdPropertyId }),
      })
      expect(update.status).toBe(400)
    }
    const ownerToken = await tokenService.sign({
      id: owner.id,
      tenantId,
      nome: owner.nome,
      email: owner.email,
      papel: owner.papel,
      ativo: owner.ativo,
      vinculoAprovadoEm: owner.vinculoAprovadoEm,
    })
    const owned = await POST(
      buildRequest('POST', { ...payload, proprietarioId: outsider.id }, ownerToken),
    )
    expect(owned.status).toBe(201)
    expect((await owned.json()).property.proprietarioId).toBe(owner.id)
    expect((await listOwners(buildRequest('GET', undefined, ownerToken))).status).toBe(403)
    expect((await listOwners(buildRequest('GET', undefined, renterToken))).status).toBe(403)
    await prisma.usuario.update({ where: { id: owner.id }, data: { ativo: false } })
    const historicalLink = await PATCH(
      buildRequest('PATCH', { titulo: 'Título atualizado', proprietarioId: owner.id }, actorToken),
      { params: Promise.resolve({ id: linkedProperty.id }) },
    )
    expect(historicalLink.status).toBe(200)
    expect((await historicalLink.json()).property.proprietarioId).toBe(owner.id)
    const newLink = await PATCH(buildRequest('PATCH', { proprietarioId: owner.id }, actorToken), {
      params: Promise.resolve({ id: createdPropertyId }),
    })
    expect(newLink.status).toBe(400)
  })

  it('ordena valores de venda e aluguel sobre todo o resultado, antes da paginação', async () => {
    const variants = [
      { finalidade: 'ALUGUEL' as const, valor: 1000, valorAluguel: null },
      { finalidade: 'VENDA' as const, valor: 300000, valorAluguel: null },
      { finalidade: 'AMBOS' as const, valor: 500000, valorAluguel: 1500 },
      { finalidade: 'ALUGUEL' as const, valor: 2000, valorAluguel: null },
      { finalidade: 'VENDA' as const, valor: 250000, valorAluguel: null },
    ]
    const ids: string[] = []
    for (const [index, values] of variants.entries()) {
      ids.push(
        (
          await prisma.imovel.create({
            data: {
              ...values,
              tenantId,
              responsavelId: actorId,
              tipo: 'CASA',
              titulo: `Price sort ${index}`,
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
      ['APARTAMENTO', 'CASA', 'COBERTURA', 'COMERCIAL', 'LOFT', 'OUTRO', 'STUDIO'],
      ['RENTED', 'PUBLISHED', 'DRAFT', 'INACTIVE', 'SOLD'],
    ],
    [
      'en-US',
      ['APARTAMENTO', 'COMERCIAL', 'CASA', 'LOFT', 'OUTRO', 'COBERTURA', 'STUDIO'],
      ['PUBLISHED', 'INACTIVE', 'RENTED', 'SOLD', 'DRAFT'],
    ],
    [
      'es-ES',
      ['APARTAMENTO', 'COBERTURA', 'CASA', 'COMERCIAL', 'LOFT', 'OUTRO', 'STUDIO'],
      ['RENTED', 'PUBLISHED', 'DRAFT', 'INACTIVE', 'SOLD'],
    ],
  ] as const)(
    'ordena rótulos em %s antes de paginar e mantém o isolamento por tenant',
    async (locale, typeOrder, statusOrder) => {
      const prefix = `Labels-${locale}-${randomUUID()}`
      const types = [
        'STUDIO',
        'CASA',
        'COBERTURA',
        'OUTRO',
        'APARTAMENTO',
        'COMERCIAL',
        'LOFT',
      ] as const
      const ids = new Map<string, string>()
      for (const tipo of types) {
        const row = await prisma.imovel.create({
          data: {
            tenantId,
            responsavelId: actorId,
            titulo: `${prefix}-types`,
            finalidade: 'ALUGUEL',
            tipo,
            valor: 1000,
          },
        })
        ids.set(tipo, row.id)
      }
      const foreign = await prisma.imovel.findUniqueOrThrow({
        where: { id: otherTenantPropertyId },
        select: { responsavelId: true },
      })
      await prisma.imovel.create({
        data: {
          tenantId: otherTenantId,
          responsavelId: foreign.responsavelId,
          titulo: `${prefix}-types`,
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor: 1000,
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
        const row = await prisma.imovel.create({
          data: {
            tenantId,
            responsavelId: actorId,
            titulo: `${prefix}-statuses`,
            finalidade: 'ALUGUEL',
            tipo: 'CASA',
            valor: 1000,
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
