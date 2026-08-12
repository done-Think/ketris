import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'

import { GET, POST } from './route'

describe('/api/auth/users (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const tokenService = new JoseTokenService()
  let tenantId: string
  let adminToken: string
  let agentToken: string

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

    const agent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Agente Teste',
        email: `agent-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })

    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      nome: admin.nome,
      email: admin.email,
      papel: admin.papel,
      ativo: admin.ativo,
    })

    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      nome: agent.nome,
      email: agent.email,
      papel: agent.papel,
      ativo: agent.ativo,
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/auth/users', {
      method,
      ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  describe('POST', () => {
    it('retorna 201 e o usuário criado (sem senhaHash) quando o ator é ADMIN', async () => {
      const email = `nova-${randomUUID()}@ketris.dev`

      const response = await POST(
        buildRequest(
          'POST',
          { nome: 'Novo Agente', email, password: 'senha-longa-123' },
          adminToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.user.email).toBe(email)
      expect(json.user.tenantId).toBe(tenantId)
      expect(json.user.papel).toBe('AGENT')
      expect(json.user.ativo).toBe(true)
      expect(json.user).not.toHaveProperty('senhaHash')
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await POST(
        buildRequest('POST', {
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
          'POST',
          { nome: 'X', email: `x-${randomUUID()}@ketris.dev`, password: 'senha-longa-123' },
          agentToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
    })

    it('retorna 409 quando já existe usuário com o e-mail neste tenant', async () => {
      const email = `duplicado-${randomUUID()}@ketris.dev`

      const primeira = await POST(
        buildRequest('POST', { nome: 'Primeira', email, password: 'senha-longa-123' }, adminToken),
      )
      expect(primeira.status).toBe(201)

      const segunda = await POST(
        buildRequest('POST', { nome: 'Segunda', email, password: 'outra-senha-123' }, adminToken),
      )
      const json = await segunda.json()

      expect(segunda.status).toBe(409)
      expect(json.error.code).toBe('EMAIL_ALREADY_IN_USE')
    })

    it('retorna 400 quando o corpo falha na validação Zod', async () => {
      const response = await POST(
        buildRequest('POST', { nome: '', email: 'nao-e-email', password: '123' }, adminToken),
      )
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.issues.length).toBeGreaterThan(0)
    })

    it('rejeita papel ADMIN no corpo (schema não aceita)', async () => {
      const response = await POST(
        buildRequest(
          'POST',
          {
            nome: 'Tentativa',
            email: `tentativa-${randomUUID()}@ketris.dev`,
            password: 'senha-longa-123',
            papel: 'ADMIN',
          },
          adminToken,
        ),
      )
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET', () => {
    it('retorna 200 com a lista de usuários do tenant, sem incluir administradores', async () => {
      const response = await GET(buildRequest('GET', undefined, adminToken))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(json.users)).toBe(true)
      expect(json.users.every((user: { papel: string }) => user.papel !== 'ADMIN')).toBe(true)
      expect(json.users.some((user: { tenantId: string }) => user.tenantId === tenantId)).toBe(true)
    })

    it('retorna 403 quando o ator autenticado não é ADMIN', async () => {
      const response = await GET(buildRequest('GET', undefined, agentToken))
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
    })

    it('retorna 401 sem Authorization header', async () => {
      const response = await GET(buildRequest('GET', undefined))
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error.code).toBe('UNAUTHORIZED')
    })
  })
})
