import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'

import { POST as login } from '../../../../login/route'
import { PATCH } from '../../../../users/[id]/approve/route'

describe('PATCH /api/auth/users/{id}/approve (integração)', () => {
  const tenantSlug = `test-tenant-approve-${randomUUID()}`
  const tokenService = new JoseTokenService()
  const pendingPassword = 'senha-longa-123'
  let tenantId: string
  let adminToken: string
  let agentToken: string
  let pendingAgentId: string
  let pendingAgentEmail: string
  let adminOnlyTargetId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Approve', slug: tenantSlug },
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
      vinculoAprovadoEm: admin.vinculoAprovadoEm,
    })

    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      nome: agent.nome,
      email: agent.email,
      papel: agent.papel,
      ativo: agent.ativo,
      vinculoAprovadoEm: agent.vinculoAprovadoEm,
    })

    adminOnlyTargetId = admin.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(id: string, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/auth/users/${id}/approve`, {
      method: 'PATCH',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('retorna 403 quando o ator não é ADMIN', async () => {
    const bcrypt = await import('bcryptjs')
    const pending = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Pendente',
        email: `pendente-${randomUUID()}@ketris.dev`,
        senhaHash: await bcrypt.hash(pendingPassword, 10),
        papel: 'AGENT',
        vinculoAprovadoEm: null,
      },
    })

    const response = await PATCH(buildRequest(pending.id, agentToken), context(pending.id))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('retorna 404 quando o alvo é um ADMIN', async () => {
    const response = await PATCH(
      buildRequest(adminOnlyTargetId, adminToken),
      context(adminOnlyTargetId),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('USER_NOT_FOUND')
  })

  it('retorna 404 quando o id não existe', async () => {
    const response = await PATCH(
      buildRequest('id-inexistente', adminToken),
      context('id-inexistente'),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('USER_NOT_FOUND')
  })

  it('aprova o vínculo pendente e o corretor passa a conseguir logar', async () => {
    const bcrypt = await import('bcryptjs')
    pendingAgentEmail = `pendente-${randomUUID()}@ketris.dev`
    const pending = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Pendente',
        email: pendingAgentEmail,
        senhaHash: await bcrypt.hash(pendingPassword, 10),
        papel: 'AGENT',
        vinculoAprovadoEm: null,
      },
    })
    pendingAgentId = pending.id

    const loginBefore = await login(
      new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: pendingAgentEmail, password: pendingPassword }),
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const loginBeforeJson = await loginBefore.json()
    expect(loginBefore.status).toBe(403)
    expect(loginBeforeJson.error.code).toBe('MEMBERSHIP_PENDING_APPROVAL')

    const response = await PATCH(buildRequest(pendingAgentId, adminToken), context(pendingAgentId))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.user.pendingApproval).toBe(false)

    const loginAfter = await login(
      new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: pendingAgentEmail, password: pendingPassword }),
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    expect(loginAfter.status).toBe(200)
  })

  it('é idempotente — aprovar de novo retorna 200 sem erro', async () => {
    const response = await PATCH(buildRequest(pendingAgentId, adminToken), context(pendingAgentId))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.user.pendingApproval).toBe(false)
  })
})
