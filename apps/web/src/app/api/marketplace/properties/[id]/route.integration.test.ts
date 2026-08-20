import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from './route'

describe('GET /api/marketplace/properties/[id] (integração)', () => {
  let tenantId: string
  let publishedId: string
  let draftId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Detalhe', slug: `mkt-detail-${randomUUID()}` },
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

    const published = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: responsavel.id,
        titulo: 'Casa publicada',
        descricao: 'Casa ampla com quintal',
        finalidade: 'VENDA',
        tipo: 'casa',
        quartos: 3,
        valor: 550000,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
        endereco: {
          create: {
            logradouro: 'Rua B',
            numero: '20',
            bairro: 'Jardim',
            cidade: 'Curitiba',
            estado: 'PR',
            cep: '80010-000',
          },
        },
        midias: {
          create: [
            { url: 'https://cdn.ketris.dev/2.jpg', tipo: 'foto', ordem: 1 },
            { url: 'https://cdn.ketris.dev/1.jpg', tipo: 'foto', ordem: 0 },
          ],
        },
      },
    })
    publishedId = published.id

    const draft = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: responsavel.id,
        titulo: 'Casa em rascunho',
        finalidade: 'VENDA',
        tipo: 'casa',
        valor: 600000,
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
    const response = await GET(buildRequest(publishedId), { params: { id: publishedId } })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.id).toBe(publishedId)
    expect(json.property).not.toHaveProperty('tenantId')
    expect(json.property.endereco.cidade).toBe('Curitiba')
    expect(json.property.midias.map((m: { ordem: number }) => m.ordem)).toEqual([0, 1])
    expect(json.property.capaUrl).toBe('https://cdn.ketris.dev/1.jpg')
  })

  it('retorna 404 para um imóvel em rascunho (não publicado)', async () => {
    const response = await GET(buildRequest(draftId), { params: { id: draftId } })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('PROPERTY_NOT_FOUND')
  })

  it('retorna 404 para um id inexistente', async () => {
    const response = await GET(buildRequest('inexistente'), { params: { id: 'inexistente' } })

    expect(response.status).toBe(404)
  })
})
