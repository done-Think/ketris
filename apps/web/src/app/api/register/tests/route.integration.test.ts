import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST as login } from '../../auth/login/route'
import { POST } from '../route'

describe('POST /api/register (integração)', () => {
  const createdTenantIds: string[] = []
  let existingAgencyId: string
  let existingAgencyEmail: string

  beforeAll(async () => {
    await prisma.tenant.upsert({
      where: { slug: 'locatarios' },
      update: {},
      create: { nome: 'Locatários Ketris', slug: 'locatarios' },
    })

    const agency = await prisma.tenant.create({
      data: { nome: 'Imobiliária Existente', slug: `imobiliaria-existente-${randomUUID()}` },
    })
    existingAgencyId = agency.id
    createdTenantIds.push(agency.id)

    existingAgencyEmail = `admin-${randomUUID()}@ketris.dev`
    await prisma.usuario.create({
      data: {
        tenantId: agency.id,
        nome: 'Admin da Imobiliária',
        email: existingAgencyEmail,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
  })

  afterAll(async () => {
    for (const tenantId of createdTenantIds) {
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('imobiliaria: cria um tenant novo com ADMIN e já retorna sessão logada', async () => {
    const email = `nova-imobiliaria-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({
        profile: 'imobiliaria',
        fullName: 'Dona da Imobiliária',
        companyName: 'Imobiliária Nova Ltda',
        email,
        password: 'senha-longa-123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.outcome).toBe('REGISTERED')
    expect(json.user.role).toBe('ADMIN')
    expect(json.user.email).toBe(email)
    expect(typeof json.accessToken).toBe('string')
    expect(typeof json.refreshToken).toBe('string')

    const createdTenant = await prisma.tenant.findUnique({ where: { id: json.user.tenantId } })
    expect(createdTenant).not.toBeNull()
    if (createdTenant) createdTenantIds.push(createdTenant.id)
  })

  it('corretor autônomo (sem agencyId): cria um tenant novo, igual imobiliária', async () => {
    const email = `corretor-autonomo-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({
        profile: 'corretor',
        fullName: 'Corretor Autônomo',
        email,
        password: 'senha-longa-123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.outcome).toBe('REGISTERED')
    expect(json.user.role).toBe('ADMIN')

    if (json.user?.tenantId) createdTenantIds.push(json.user.tenantId)
  })

  it('corretor com agencyId: cria vínculo pendente, sem sessão, e bloqueia login até aprovação', async () => {
    const email = `corretor-pendente-${randomUUID()}@ketris.dev`
    const password = 'senha-longa-123'

    const response = await POST(
      buildRequest({
        profile: 'corretor',
        fullName: 'Corretor Pendente',
        email,
        password,
        agencyId: existingAgencyId,
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(202)
    expect(json.outcome).toBe('PENDING_APPROVAL')
    expect(json.email).toBe(email)
    expect(json.accessToken).toBeUndefined()

    const loginResponse = await login(
      new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const loginJson = await loginResponse.json()
    expect(loginResponse.status).toBe(403)
    expect(loginJson.error.code).toBe('MEMBERSHIP_PENDING_APPROVAL')
  })

  it('corretor com agencyId inexistente: retorna 404 AGENCY_NOT_FOUND', async () => {
    const response = await POST(
      buildRequest({
        profile: 'corretor',
        fullName: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
        agencyId: 'id-que-nao-existe',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('AGENCY_NOT_FOUND')
  })

  it('corretor com agencyId: retorna 409 quando já existe alguém com o e-mail nessa imobiliária', async () => {
    const response = await POST(
      buildRequest({
        profile: 'corretor',
        fullName: 'Duplicado',
        email: existingAgencyEmail,
        password: 'senha-longa-123',
        agencyId: existingAgencyId,
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('EMAIL_ALREADY_IN_USE')
  })

  it('locatario: entra no tenant compartilhado e já retorna sessão logada', async () => {
    const email = `locatario-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({
        profile: 'locatario',
        fullName: 'Maria Locatária',
        email,
        password: 'senha-longa-123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.outcome).toBe('REGISTERED')
    expect(json.user.role).toBe('RENTER')

    const renterTenant = await prisma.tenant.findUnique({ where: { slug: 'locatarios' } })
    expect(json.user.tenantId).toBe(renterTenant?.id)
  })

  it('retorna 400 quando o corpo falha na validação Zod', async () => {
    const response = await POST(buildRequest({ profile: 'locatario', email: 'nao-e-email' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })
})
