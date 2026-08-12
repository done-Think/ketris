import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'

import { DELETE, GET, PATCH } from './route'

describe('/api/auth/users/[id] (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const tokenService = new JoseTokenService()
  let tenantId: string
  let adminId: string
  let adminToken: string
  let agentToken: string
  let targetId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Users Id', slug: tenantSlug },
    })
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
    adminId = admin.id

    const agent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Agente Teste',
        email: `agent-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })

    const target = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Alvo Teste',
        email: `alvo-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    targetId = target.id

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

  function buildRequest(method: string, id: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/auth/users/${id}`, {
      method,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  function context(id: string) {
    return { params: { id } }
  }

  describe('GET', () => {
    it('retorna 200 com o usuário quando o ator é ADMIN', async () => {
      const response = await GET(
        buildRequest('GET', targetId, undefined, adminToken),
        context(targetId),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.user.id).toBe(targetId)
    })

    it('retorna 404 quando o id não existe', async () => {
      const response = await GET(
        buildRequest('GET', 'id-inexistente', undefined, adminToken),
        context('id-inexistente'),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('USER_NOT_FOUND')
    })

    it('retorna 404 quando o id é de um ADMIN (invisível pela rota geral)', async () => {
      const response = await GET(
        buildRequest('GET', adminId, undefined, adminToken),
        context(adminId),
      )
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.code).toBe('USER_NOT_FOUND')
    })

    it('retorna 403 quando o ator não é ADMIN', async () => {
      const response = await GET(
        buildRequest('GET', targetId, undefined, agentToken),
        context(targetId),
      )
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PATCH', () => {
    it('atualiza nome e papel quando o ator é ADMIN', async () => {
      const response = await PATCH(
        buildRequest('PATCH', targetId, { nome: 'Alvo Renomeado', papel: 'OWNER' }, adminToken),
        context(targetId),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.user.nome).toBe('Alvo Renomeado')
      expect(json.user.papel).toBe('OWNER')
    })

    it('rejeita papel ADMIN no corpo (schema não aceita)', async () => {
      const response = await PATCH(
        buildRequest('PATCH', targetId, { papel: 'ADMIN' }, adminToken),
        context(targetId),
      )
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('retorna 403 quando o ator não é ADMIN', async () => {
      const response = await PATCH(
        buildRequest('PATCH', targetId, { nome: 'X' }, agentToken),
        context(targetId),
      )
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })

  describe('DELETE', () => {
    it('desativa o usuário (soft delete) e retorna ativo: false', async () => {
      const toDeactivate = await prisma.usuario.create({
        data: {
          tenantId,
          nome: 'Para Desativar',
          email: `desativar-${randomUUID()}@ketris.dev`,
          senhaHash: 'hash-fake',
          papel: 'AGENT',
        },
      })

      const response = await DELETE(
        buildRequest('DELETE', toDeactivate.id, undefined, adminToken),
        context(toDeactivate.id),
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.user.ativo).toBe(false)

      const stillExists = await prisma.usuario.findUnique({ where: { id: toDeactivate.id } })
      expect(stillExists).not.toBeNull()
    })

    it('retorna 400 quando o ADMIN tenta desativar a própria conta', async () => {
      const response = await DELETE(
        buildRequest('DELETE', adminId, undefined, adminToken),
        context(adminId),
      )
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.code).toBe('CANNOT_DEACTIVATE_SELF')
    })

    it('retorna 403 quando o ator não é ADMIN', async () => {
      const response = await DELETE(
        buildRequest('DELETE', targetId, undefined, agentToken),
        context(targetId),
      )
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })
})
