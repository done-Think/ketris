import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE, GET, PATCH } from './route'
import { POST as publish } from './publish/route'
import { POST as unpublish } from './unpublish/route'

describe('/api/properties/{id} (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let otherAgentToken: string
  let adminToken: string
  let completePropertyId: string
  let incompletePropertyId: string
  let otherTenantPropertyId: string
  let ownedByActorPropertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Property Detail', slug: `property-detail-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Other Property Detail', slug: `other-property-detail-${randomUUID()}` },
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
      vinculoAprovadoEm: actor.vinculoAprovadoEm,
    })

    const completeProperty = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        titulo: 'Casa completa',
        finalidade: 'VENDA',
        tipo: 'casa',
        quartos: 3,
        banheiros: 2,
        vagas: 2,
        areaM2: 120,
        valor: 650000,
        status: 'DRAFT',
        endereco: {
          create: {
            logradouro: 'Rua das Flores',
            numero: '42',
            bairro: 'Mercês',
            cidade: 'Curitiba',
            estado: 'PR',
            cep: '80510000',
          },
        },
        midias: {
          create: [{ url: 'https://cdn.ketris.dev/complete/photo.jpg', tipo: 'foto', ordem: 0 }],
        },
      },
    })
    completePropertyId = completeProperty.id

    const incompleteProperty = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        titulo: 'Sem mídia',
        finalidade: 'ALUGUEL',
        tipo: 'studio',
        valor: 1800,
        status: 'DRAFT',
      },
    })
    incompletePropertyId = incompleteProperty.id

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
        valor: 2000,
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

    const admin = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin da Imobiliária',
        email: `admin-imobiliaria-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
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

    const ownedByActorProperty = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        titulo: 'Casa do corretor dono',
        finalidade: 'VENDA',
        tipo: 'casa',
        valor: 500000,
        status: 'DRAFT',
        endereco: {
          create: {
            logradouro: 'Rua do Dono',
            numero: '10',
            bairro: 'Centro',
            cidade: 'Curitiba',
            estado: 'PR',
            cep: '80010000',
          },
        },
        midias: {
          create: [{ url: 'https://cdn.ketris.dev/owned/photo.jpg', tipo: 'foto', ordem: 0 }],
        },
      },
    })
    ownedByActorPropertyId = ownedByActorProperty.id
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

  function buildRequest(
    method: string,
    id: string,
    body?: unknown,
    token = actorToken,
  ): NextRequest {
    return new NextRequest(`http://localhost/api/properties/${id}`, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('consulta imóvel dentro do tenant do ator', async () => {
    const response = await GET(buildRequest('GET', completePropertyId), context(completePropertyId))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.id).toBe(completePropertyId)
    expect(json.property.tenantId).toBe(tenantId)
  })

  it('retorna 404 para imóvel de outro tenant', async () => {
    const response = await GET(
      buildRequest('GET', otherTenantPropertyId),
      context(otherTenantPropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('atualiza imóvel do tenant do ator', async () => {
    const response = await PATCH(
      buildRequest('PATCH', completePropertyId, { titulo: 'Casa atualizada' }),
      context(completePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.titulo).toBe('Casa atualizada')
  })

  it('publica imóvel completo', async () => {
    const response = await publish(
      buildRequest('POST', completePropertyId),
      context(completePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.status).toBe('PUBLISHED')
    expect(json.property.publicadoEm).toBeTruthy()
  })

  it('bloqueia publicação de imóvel incompleto', async () => {
    const response = await publish(
      buildRequest('POST', incompletePropertyId),
      context(incompletePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('PROPERTY_PUBLISH_VALIDATION_ERROR')
  })

  it('despublica imóvel publicado', async () => {
    const response = await unpublish(
      buildRequest('POST', completePropertyId),
      context(completePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.status).toBe('INACTIVE')
    expect(json.property.publicadoEm).toBeNull()
  })

  it('inativa imóvel pelo DELETE', async () => {
    const response = await DELETE(
      buildRequest('DELETE', incompletePropertyId),
      context(incompletePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.status).toBe('INACTIVE')
  })

  describe('permissões: dono, admin da imobiliária e outro corretor', () => {
    it('retorna 404 quando outro corretor da mesma imobiliária tenta ver o imóvel', async () => {
      const response = await GET(
        buildRequest('GET', ownedByActorPropertyId, undefined, otherAgentToken),
        context(ownedByActorPropertyId),
      )

      expect(response.status).toBe(404)
    })

    it('permite que o admin da imobiliária veja o imóvel de outro corretor', async () => {
      const response = await GET(
        buildRequest('GET', ownedByActorPropertyId, undefined, adminToken),
        context(ownedByActorPropertyId),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.property.id).toBe(ownedByActorPropertyId)
    })

    it('retorna 404 quando outro corretor da mesma imobiliária tenta editar o imóvel', async () => {
      const response = await PATCH(
        buildRequest(
          'PATCH',
          ownedByActorPropertyId,
          { titulo: 'Tentativa indevida' },
          otherAgentToken,
        ),
        context(ownedByActorPropertyId),
      )

      expect(response.status).toBe(404)
    })

    it('permite que o admin da imobiliária edite o imóvel de outro corretor', async () => {
      const response = await PATCH(
        buildRequest('PATCH', ownedByActorPropertyId, { titulo: 'Editado pelo admin' }, adminToken),
        context(ownedByActorPropertyId),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.property.titulo).toBe('Editado pelo admin')
    })

    it('retorna 404 quando outro corretor da mesma imobiliária tenta publicar o imóvel', async () => {
      const response = await publish(
        buildRequest('POST', ownedByActorPropertyId, undefined, otherAgentToken),
        context(ownedByActorPropertyId),
      )

      expect(response.status).toBe(404)
    })

    it('permite que o admin da imobiliária publique o imóvel de outro corretor', async () => {
      const response = await publish(
        buildRequest('POST', ownedByActorPropertyId, undefined, adminToken),
        context(ownedByActorPropertyId),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.property.status).toBe('PUBLISHED')
    })

    it('retorna 404 quando outro corretor da mesma imobiliária tenta despublicar o imóvel', async () => {
      const response = await unpublish(
        buildRequest('POST', ownedByActorPropertyId, undefined, otherAgentToken),
        context(ownedByActorPropertyId),
      )

      expect(response.status).toBe(404)
    })

    it('retorna 404 quando outro corretor da mesma imobiliária tenta excluir o imóvel', async () => {
      const response = await DELETE(
        buildRequest('DELETE', ownedByActorPropertyId, undefined, otherAgentToken),
        context(ownedByActorPropertyId),
      )

      expect(response.status).toBe(404)
    })

    it('permite que o próprio corretor responsável exclua seu imóvel', async () => {
      const response = await DELETE(
        buildRequest('DELETE', ownedByActorPropertyId, undefined, actorToken),
        context(ownedByActorPropertyId),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.property.status).toBe('INACTIVE')
    })
  })
})
