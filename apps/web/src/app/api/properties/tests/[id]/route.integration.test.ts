import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE, GET, PATCH } from '../../[id]/route'
import { POST as publish } from '../../[id]/publish/route'
import { POST as unpublish } from '../../[id]/unpublish/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('/api/properties/{id} (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorId: string
  let actorToken: string
  let otherAgentToken: string
  let adminToken: string
  let completePropertyId: string
  let incompletePropertyId: string
  let otherTenantPropertyId: string
  let ownedByActorPropertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Property Detail', slug: `property-detail-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Other Property Detail', slug: `other-property-detail-${randomUUID()}` },
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

    const completeProperty = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: actor.id,
        title: 'Casa completa',
        purpose: 'SALE',
        type: 'HOUSE',
        bedrooms: 3,
        bathrooms: 2,
        parkingSpots: 2,
        areaSqm: 120,
        price: 650000,
        status: 'DRAFT',
        address: {
          create: {
            street: 'Rua das Flores',
            number: '42',
            neighborhood: 'Mercês',
            city: 'Curitiba',
            state: 'PR',
            zipCode: '80510000',
          },
        },
        media: {
          create: [
            { url: 'https://cdn.ketris.dev/complete/photo.jpg', type: 'PHOTO', position: 0 },
          ],
        },
      },
    })
    completePropertyId = completeProperty.id

    const incompleteProperty = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: actor.id,
        title: 'Sem mídia',
        purpose: 'RENT',
        type: 'STUDIO',
        price: 1800,
        status: 'DRAFT',
      },
    })
    incompletePropertyId = incompleteProperty.id

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
        price: 2000,
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

    const ownedByActorProperty = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: actor.id,
        title: 'Casa do corretor dono',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 500000,
        status: 'DRAFT',
        address: {
          create: {
            street: 'Rua do Dono',
            number: '10',
            neighborhood: 'Centro',
            city: 'Curitiba',
            state: 'PR',
            zipCode: '80010000',
          },
        },
        media: {
          create: [{ url: 'https://cdn.ketris.dev/owned/photo.jpg', type: 'PHOTO', position: 0 }],
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
      buildRequest('PATCH', completePropertyId, { title: 'Casa atualizada' }),
      context(completePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.title).toBe('Casa atualizada')
  })

  it('preserva IDs e datas de mídia ao reordenar, atualizar e remover itens', async () => {
    const original = await prisma.propertyMedia.findFirstOrThrow({
      where: { propertyId: completePropertyId },
    })
    const addedUrl = `/api/properties/media/properties/${tenantId}/new-property-photo.jpg`
    const response = await PATCH(
      buildRequest('PATCH', completePropertyId, {
        media: [
          { url: addedUrl, type: 'photo', position: 0 },
          { url: original.url, type: 'floorPlan', position: 1 },
        ],
      }),
      context(completePropertyId),
    )
    expect(response.status).toBe(200)
    const retained = await prisma.propertyMedia.findUniqueOrThrow({ where: { id: original.id } })
    expect(retained.createdAt).toEqual(original.createdAt)
    expect(retained.type).toBe('FLOOR_PLAN')
    expect(retained.position).toBe(1)
    const added = await prisma.propertyMedia.findFirstOrThrow({
      where: { propertyId: completePropertyId, url: addedUrl },
    })
    expect(added.id).not.toBe(original.id)

    const media = [{ url: original.url, type: 'photo', position: 0 }]
    expect(
      (
        await PATCH(
          buildRequest('PATCH', completePropertyId, { media: media }),
          context(completePropertyId),
        )
      ).status,
    ).toBe(200)
    expect(await prisma.propertyMedia.findUnique({ where: { id: added.id } })).toBeNull()
    const remaining = await prisma.propertyMedia.findUniqueOrThrow({ where: { id: original.id } })
    expect(remaining.createdAt).toEqual(original.createdAt)
    expect(
      (
        await PATCH(
          buildRequest('PATCH', completePropertyId, { media: media }),
          context(completePropertyId),
        )
      ).status,
    ).toBe(200)
    expect(
      (await prisma.propertyMedia.findUniqueOrThrow({ where: { id: original.id } })).updatedAt,
    ).toEqual(remaining.updatedAt)
  })

  it('publica imóvel completo', async () => {
    const response = await publish(
      buildRequest('POST', completePropertyId),
      context(completePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.status).toBe('PUBLISHED')
    expect(json.property.publishedAt).toBeTruthy()
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
    const beforeUnpublish = await prisma.property.findUniqueOrThrow({
      where: { id: completePropertyId },
    })
    const response = await unpublish(
      buildRequest('POST', completePropertyId),
      context(completePropertyId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.property.status).toBe('INACTIVE')
    expect(json.property.publishedAt).toBe(beforeUnpublish.publishedAt?.toISOString())
  })

  it('inativa o imóvel pelo DELETE e preserva seus dados', async () => {
    const response = await DELETE(
      buildRequest('DELETE', incompletePropertyId),
      context(incompletePropertyId),
    )

    expect(response.status).toBe(204)

    const afterDelete = await prisma.property.findUnique({ where: { id: incompletePropertyId } })
    expect(afterDelete?.status).toBe('INACTIVE')
  })

  it('inativa o imóvel mesmo com uma proposta vinculada', async () => {
    const propertyWithOpportunity = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: actorId,
        title: 'Imóvel com proposta',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2500,
        status: 'DRAFT',
      },
    })
    await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: propertyWithOpportunity.id,
        responsibleId: await propertyResponsibleId(prisma, propertyWithOpportunity.id),
        interestedName: 'Interessado Teste',
        interestedEmail: 'interessado-teste@example.com',
        proposedValue: 2500,
      },
    })

    const response = await DELETE(
      buildRequest('DELETE', propertyWithOpportunity.id),
      context(propertyWithOpportunity.id),
    )
    expect(response.status).toBe(204)

    const stillExists = await prisma.property.findUnique({
      where: { id: propertyWithOpportunity.id },
    })
    expect(stillExists?.status).toBe('INACTIVE')
    expect(
      await prisma.opportunity.count({ where: { propertyId: propertyWithOpportunity.id } }),
    ).toBe(1)
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
          { title: 'Tentativa indevida' },
          otherAgentToken,
        ),
        context(ownedByActorPropertyId),
      )

      expect(response.status).toBe(404)
    })

    it('permite que o admin da imobiliária edite o imóvel de outro corretor', async () => {
      const response = await PATCH(
        buildRequest('PATCH', ownedByActorPropertyId, { title: 'Editado pelo admin' }, adminToken),
        context(ownedByActorPropertyId),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.property.title).toBe('Editado pelo admin')
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

    it('permite que o próprio corretor responsável inative seu imóvel', async () => {
      const beforeInactivation = await prisma.property.findUniqueOrThrow({
        where: { id: ownedByActorPropertyId },
      })
      const response = await DELETE(
        buildRequest('DELETE', ownedByActorPropertyId, undefined, actorToken),
        context(ownedByActorPropertyId),
      )

      expect(response.status).toBe(204)

      const afterDelete = await prisma.property.findUnique({
        where: { id: ownedByActorPropertyId },
      })
      expect(afterDelete?.status).toBe('INACTIVE')
      expect(afterDelete?.publishedAt).toEqual(beforeInactivation.publishedAt)
      expect(afterDelete?.createdAt).toEqual(beforeInactivation.createdAt)
    })
  })
})
