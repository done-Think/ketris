import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST } from './route'

describe('POST /api/auth/login (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const email = `login-${randomUUID()}@ketris.dev`
  const password = 'senha-correta-123'
  const deactivatedEmail = `login-deactivated-${randomUUID()}@ketris.dev`
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { nome: 'Tenant Login', slug: tenantSlug } })
    tenantId = tenant.id

    await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Login Teste',
        email,
        senhaHash: await bcrypt.hash(password, 10),
        papel: 'ADMIN',
      },
    })

    await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Login Desativado',
        email: deactivatedEmail,
        senhaHash: await bcrypt.hash(password, 10),
        papel: 'AGENT',
        ativo: false,
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('retorna 200, o usuário em inglês (sem senhaHash), access token e refresh token com credenciais corretas', async () => {
    const response = await POST(buildRequest({ email, password }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.user).toEqual({
      id: expect.any(String),
      tenantId,
      name: 'Login Teste',
      email,
      role: 'ADMIN',
      active: true,
      pendingApproval: false,
    })
    expect(json.user).not.toHaveProperty('senhaHash')
    expect(json.user).not.toHaveProperty('nome')
    expect(json.user).not.toHaveProperty('papel')
    expect(json.user).not.toHaveProperty('ativo')
    expect(typeof json.accessToken).toBe('string')
    expect(typeof json.refreshToken).toBe('string')
  })

  it('retorna 401 com senha errada, com mensagem genérica', async () => {
    const response = await POST(buildRequest({ email, password: 'senha-errada' }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('retorna 401 com e-mail inexistente, mesma mensagem genérica (anti-enumeração)', async () => {
    const response = await POST(buildRequest({ email: 'inexistente@ketris.dev', password }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('retorna 403 ACCOUNT_DEACTIVATED com credenciais corretas de conta desativada', async () => {
    const response = await POST(buildRequest({ email: deactivatedEmail, password }))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('ACCOUNT_DEACTIVATED')
  })

  it('retorna 401 INVALID_CREDENTIALS (não ACCOUNT_DEACTIVATED) com senha errada numa conta desativada', async () => {
    const response = await POST(buildRequest({ email: deactivatedEmail, password: 'senha-errada' }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('retorna 400 VALIDATION_ERROR quando o corpo falha na validação Zod', async () => {
    const response = await POST(buildRequest({ email: 'nao-e-email', password: '' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.issues.length).toBeGreaterThan(0)
  })

  it('retorna 400 MALFORMED_JSON_BODY quando o corpo não é um JSON válido', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: '{not-json',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('MALFORMED_JSON_BODY')
  })
})
