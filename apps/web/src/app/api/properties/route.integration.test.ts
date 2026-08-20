import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from './route'

describe('/api/properties (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let createdPropertyId: string
  let otherTenantPropertyId: string

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
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
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
        tipo: 'apartamento',
        valor: 1800,
        status: 'DRAFT',
      },
    })
    otherTenantPropertyId = otherProperty.id
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
          tipo: 'apartamento',
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
          midias: [{ url: 'https://cdn.ketris.dev/property/photo.jpg' }],
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
    createdPropertyId = json.property.id
  })

  it('lista apenas imóveis do tenant do ator', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken))
    const json = await response.json()

    const ids = json.properties.map((property: { id: string }) => property.id)
    expect(response.status).toBe(200)
    expect(ids).toContain(createdPropertyId)
    expect(ids).not.toContain(otherTenantPropertyId)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('GET'))

    expect(response.status).toBe(401)
  })
})
