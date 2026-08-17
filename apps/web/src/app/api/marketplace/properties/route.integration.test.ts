import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { generateOpenApiDocument } from '@server/openapi/registry'

import { GET } from './route'

describe('GET /api/marketplace/properties (integração)', () => {
  let tenantId: string
  let responsavelId: string
  let publishedId: string
  let draftId: string
  const cidade = `Cidade-${randomUUID().slice(0, 8)}`

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Marketplace', slug: `mkt-${randomUUID()}` },
    })
    tenantId = tenant.id

    const responsavel = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    responsavelId = responsavel.id

    const published = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId,
        titulo: 'Apartamento publicado',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        quartos: 2,
        valor: 2500,
        status: 'PUBLICADO',
        publicadoEm: new Date(),
        endereco: {
          create: {
            logradouro: 'Rua A',
            numero: '10',
            bairro: 'Centro',
            cidade,
            estado: 'PR',
            cep: '80000-000',
          },
        },
        midias: {
          create: [{ url: 'https://cdn.ketris.dev/capa.jpg', tipo: 'foto', ordem: 0 }],
        },
      },
    })
    publishedId = published.id

    const draft = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId,
        titulo: 'Apartamento em rascunho',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 3000,
        status: 'RASCUNHO',
      },
    })
    draftId = draft.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(query = ''): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace/properties${query}`)
  }

  it('retorna 200 e lista apenas imóveis publicados (rascunho não aparece)', async () => {
    const response = await GET(buildRequest())
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

  it('filtra por cidade (case-insensitive)', async () => {
    const response = await GET(buildRequest(`?cidade=${cidade.toLowerCase()}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.properties.some((property: { id: string }) => property.id === publishedId)).toBe(
      true,
    )
  })

  it('filtra por faixa de preço (exclui imóveis fora do teto)', async () => {
    const response = await GET(buildRequest('?precoMax=1000'))
    const json = await response.json()

    expect(json.properties.some((property: { id: string }) => property.id === publishedId)).toBe(
      false,
    )
  })

  it('retorna 400 quando a finalidade é inválida', async () => {
    const response = await GET(buildRequest('?finalidade=TEMPORADA'))

    expect(response.status).toBe(400)
  })

  it('expõe as rotas públicas do marketplace no documento OpenAPI', () => {
    const document = generateOpenApiDocument()

    expect(document.paths['/marketplace/properties']).toBeDefined()
    expect(document.paths['/marketplace/properties/{id}']).toBeDefined()
    expect(document.paths['/marketplace/properties/{id}/inquiries']).toBeDefined()
  })
})
