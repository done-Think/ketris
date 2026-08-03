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

  it('retorna 200, o usuário (sem senhaHash) e um access token com credenciais corretas', async () => {
    const response = await POST(buildRequest({ email, password }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.user.email).toBe(email)
    expect(json.user.tenantId).toBe(tenantId)
    expect(json.user).not.toHaveProperty('senhaHash')
    expect(typeof json.accessToken).toBe('string')
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

  it('retorna 400 quando o corpo falha na validação Zod', async () => {
    const response = await POST(buildRequest({ email: 'nao-e-email', password: '' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.issues.length).toBeGreaterThan(0)
  })
})
