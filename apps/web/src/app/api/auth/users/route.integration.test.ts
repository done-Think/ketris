import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'

import { POST } from './route'

describe('POST /api/auth/users (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const tokenService = new JoseTokenService()
  let tenantId: string
  let adminToken: string
  let corretorToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { nome: 'Tenant Users', slug: tenantSlug } })
    tenantId = tenant.id

    const admin = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin Teste',
        email: `admin-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })

    const corretor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Teste',
        email: `corretor-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'CORRETOR',
      },
    })

    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      nome: admin.nome,
      email: admin.email,
      papel: admin.papel,
    })

    corretorToken = await tokenService.sign({
      id: corretor.id,
      tenantId: corretor.tenantId,
      nome: corretor.nome,
      email: corretor.email,
      papel: corretor.papel,
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/auth/users', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('retorna 201 e o usuário criado (sem senhaHash) quando o ator é ADMIN', async () => {
    const email = `nova-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({ nome: 'Nova Corretora', email, password: 'senha-longa-123' }, adminToken),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.user.email).toBe(email)
    expect(json.user.tenantId).toBe(tenantId)
    expect(json.user.papel).toBe('CORRETOR')
    expect(json.user).not.toHaveProperty('senhaHash')
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await POST(
      buildRequest({
        nome: 'X',
        email: `x-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('retorna 403 quando o ator autenticado não é ADMIN', async () => {
    const response = await POST(
      buildRequest(
        { nome: 'X', email: `x-${randomUUID()}@ketris.dev`, password: 'senha-longa-123' },
        corretorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('retorna 409 quando já existe usuário com o e-mail neste tenant', async () => {
    const email = `duplicado-${randomUUID()}@ketris.dev`

    const primeira = await POST(
      buildRequest({ nome: 'Primeira', email, password: 'senha-longa-123' }, adminToken),
    )
    expect(primeira.status).toBe(201)

    const segunda = await POST(
      buildRequest({ nome: 'Segunda', email, password: 'outra-senha-123' }, adminToken),
    )
    const json = await segunda.json()

    expect(segunda.status).toBe(409)
    expect(json.error.code).toBe('EMAIL_ALREADY_IN_USE')
  })

  it('retorna 400 quando o corpo falha na validação Zod', async () => {
    const response = await POST(
      buildRequest({ nome: '', email: 'nao-e-email', password: '123' }, adminToken),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.issues.length).toBeGreaterThan(0)
  })
})
