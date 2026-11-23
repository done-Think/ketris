import { randomUUID } from 'node:crypto'

import type { UserRole } from '@prisma/client'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE, PUT } from '../../favorites/[propertyId]/route'
import { GET } from '../../favorites/route'

describe('/api/marketplace/favorites (integração)', () => {
  const tokenService = new JoseTokenService()
  const tenantIds: string[] = []
  let agencyTenantId: string
  let renterTenantId: string
  let publishedId: string
  let secondPublishedId: string
  let draftId: string
  const users = {} as Record<'agent' | 'owner' | 'renter' | 'otherRenter', string>
  const tokens = {} as Record<keyof typeof users, string>

  async function createUser(tenantId: string, role: UserRole) {
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: `Pessoa ${role}`,
        email: `favoritos-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role,
      },
    })
    const token = await tokenService.sign({
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      membershipApprovedAt: user.membershipApprovedAt,
    })
    return { user, token }
  }

  async function createProperty(responsibleId: string, status: 'PUBLISHED' | 'DRAFT') {
    const property = await prisma.property.create({
      data: {
        tenantId: agencyTenantId,
        responsibleId,
        title: `Apartamento ${status}`,
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1199,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        address: {
          create: {
            street: 'Rua dos Chanés',
            number: '495',
            neighborhood: 'Vila Costa e Silva',
            city: 'Campinas',
            state: 'SP',
            zipCode: '13081-350',
          },
        },
      },
    })
    return property.id
  }

  beforeAll(async () => {
    for (const name of ['Imobiliária Favoritos', 'Locatários Favoritos']) {
      const tenant = await prisma.tenant.create({
        data: { name, slug: `favoritos-${randomUUID()}` },
      })
      tenantIds.push(tenant.id)
    }
    ;[agencyTenantId, renterTenantId] = tenantIds

    for (const [key, tenantId, role] of [
      ['agent', agencyTenantId, 'AGENT'],
      ['owner', agencyTenantId, 'OWNER'],
      ['renter', renterTenantId, 'RENTER'],
      ['otherRenter', renterTenantId, 'RENTER'],
    ] as const) {
      const { user, token } = await createUser(tenantId, role)
      users[key] = user.id
      tokens[key] = token
    }

    publishedId = await createProperty(users.agent, 'PUBLISHED')
    secondPublishedId = await createProperty(users.agent, 'PUBLISHED')
    draftId = await createProperty(users.agent, 'DRAFT')
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })

  function request(method: string, path: string, token?: string) {
    return new NextRequest(`http://localhost/api/marketplace/favorites${path}`, {
      method,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
  }

  function save(propertyId: string, token?: string) {
    return PUT(request('PUT', `/${propertyId}`, token), {
      params: Promise.resolve({ propertyId }),
    })
  }

  function remove(propertyId: string, token?: string) {
    return DELETE(request('DELETE', `/${propertyId}`, token), {
      params: Promise.resolve({ propertyId }),
    })
  }

  function savedIds(userId: string) {
    return prisma.favoriteProperty
      .findMany({ where: { userId }, select: { propertyId: true } })
      .then((rows) => rows.map((row) => row.propertyId))
  }

  it('requires authentication to save or remove', async () => {
    expect((await save(publishedId)).status).toBe(401)
    expect((await remove(publishedId)).status).toBe(401)
  })

  it.each(['agent', 'owner', 'renter'] as const)(
    'lets the %s save a published property',
    async (role) => {
      const response = await save(publishedId, tokens[role])

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        propertyId: publishedId,
        savedAt: expect.any(String),
      })
      expect(await savedIds(users[role])).toEqual([publishedId])
    },
  )

  it('keeps the tenant of the person who saved, even for another tenant property', async () => {
    const rows = await prisma.favoriteProperty.findMany({
      where: { propertyId: publishedId, userId: users.renter },
    })

    expect(rows).toEqual([expect.objectContaining({ tenantId: renterTenantId })])
  })

  it('returns the original date when saving the same property twice', async () => {
    const first = await (await save(secondPublishedId, tokens.renter)).json()
    const second = await (await save(secondPublishedId, tokens.renter)).json()

    expect(second.savedAt).toBe(first.savedAt)
  })

  it('answers the same 404 for a draft and for a missing property', async () => {
    const draft = await save(draftId, tokens.renter)
    const missing = await save('missing-property', tokens.renter)

    expect(draft.status).toBe(404)
    expect(missing.status).toBe(404)
    expect((await draft.json()).error.code).toBe('PROPERTY_NOT_FOUND')
    expect((await missing.json()).error.code).toBe('PROPERTY_NOT_FOUND')
  })

  it('rejects an invalid property id', async () => {
    expect((await save('x'.repeat(65), tokens.renter)).status).toBe(400)
    expect((await remove('x'.repeat(65), tokens.renter)).status).toBe(400)
  })

  it('never removes the favorite of another person in the same tenant', async () => {
    expect((await remove(publishedId, tokens.otherRenter)).status).toBe(204)

    expect(await savedIds(users.renter)).toContain(publishedId)
  })

  it('removes a favorite and answers 204 again when it is already gone', async () => {
    expect((await remove(publishedId, tokens.renter)).status).toBe(204)
    expect((await remove(publishedId, tokens.renter)).status).toBe(204)

    expect(await savedIds(users.renter)).not.toContain(publishedId)
  })

  async function list(token: string) {
    const response = await GET(request('GET', '', token))
    expect(response.status).toBe(200)
    return response.json()
  }

  it('lists only the favorites of the person who is signed in', async () => {
    expect((await GET(request('GET', ''))).status).toBe(401)
    expect((await list(tokens.otherRenter)).favorites).toEqual([])

    const body = await list(tokens.renter)

    expect(body.limit).toBe(200)
    expect(body.favorites).toEqual([
      expect.objectContaining({
        propertyId: secondPublishedId,
        available: true,
        property: expect.objectContaining({ id: secondPublishedId, city: 'Campinas', price: 1199 }),
      }),
    ])
  })

  it('keeps an unpublished favorite as unavailable, without price or photos', async () => {
    await prisma.property.update({ where: { id: secondPublishedId }, data: { status: 'DRAFT' } })

    expect((await list(tokens.renter)).favorites).toEqual([
      {
        propertyId: secondPublishedId,
        savedAt: expect.any(String),
        available: false,
        property: {
          title: 'Apartamento PUBLISHED',
          city: 'Campinas',
          neighborhood: 'Vila Costa e Silva',
        },
      },
    ])
  })
})
