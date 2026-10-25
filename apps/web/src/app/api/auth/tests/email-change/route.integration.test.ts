import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUser } from '@server/auth/domain/user.entity'
import { prisma } from '@server/db/prisma'
import { SesMailer } from '@server/shared/email/ses-mailer'

import { POST as confirmPublic } from '../../email-change/verify/route'
import { POST as confirmSelf } from '../../me/email-change/verify/route'
import { POST as requestSelf } from '../../me/email-change/route'
import { POST as requestManager } from '../../users/[id]/email-change/route'

const send = vi.spyOn(SesMailer.prototype, 'send').mockResolvedValue(undefined)
let tenantId: string
let otherTenantId: string
let managerToken: string

function request(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/auth/email-change', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

function createUser(overrides: Partial<Prisma.UsuarioUncheckedCreateInput> = {}) {
  return prisma.usuario.create({
    data: {
      tenantId,
      nome: 'Email change target',
      email: `${randomUUID()}@change.example.test`,
      senhaHash: 'not-used-in-email-confirmation',
      papel: 'AGENT',
      emailVerificadoEm: null,
      vinculoAprovadoEm: null,
      ...overrides,
    },
  })
}

async function tokenFor(userId: string) {
  const user = await authContainer.userRepository.findById(userId)
  if (!user) throw new Error('Test account missing')
  return authContainer.tokenService.sign(toAuthenticatedUser(user))
}

async function begin(userId: string, email: string, token = managerToken, locale = 'pt-BR') {
  return requestManager(request({ email, locale }, token), {
    params: Promise.resolve({ id: userId }),
  })
}

async function proofFor(userId: string) {
  const stored = await prisma.emailVerificationCode.findFirstOrThrow({
    where: { userId, purpose: 'EMAIL_CHANGE' },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })
  const message = send.mock.calls.at(-1)?.[0]
  const code = message?.text?.match(/\b\d{6}\b/)?.[0]
  if (!code) throw new Error('Email missing confirmation code')
  return { stored, code, message }
}

async function createRefresh(userId: string, accountTenantId = tenantId) {
  return prisma.refreshToken.create({
    data: {
      userId,
      tenantId: accountTenantId,
      tokenHash: randomUUID(),
      expiresAt: new Date(Date.now() + 60_000),
    },
  })
}

describe('Email change by manager with public confirmation', () => {
  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({ data: { nome: 'Email change', slug: `change-${randomUUID()}` } })
    ).id
    otherTenantId = (
      await prisma.tenant.create({
        data: { nome: 'Other email change', slug: `change-${randomUUID()}` },
      })
    ).id
    const manager = await createUser({
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
      vinculoAprovadoEm: new Date(),
    })
    managerToken = await tokenFor(manager.id)
  })

  beforeEach(() => send.mockClear())

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    if (otherTenantId) await prisma.tenant.delete({ where: { id: otherTenantId } })
    send.mockRestore()
  })

  it.each([
    ['pt-BR', '/pt/'],
    ['en-US', '/en/'],
    ['es-ES', '/es/'],
  ])(
    'confirms an unverified pending account through a localized link without a session (%s)',
    async (locale, prefix) => {
      const target = await createUser()
      const otherAccount = await createUser({
        tenantId: otherTenantId,
        email: target.email,
        emailVerificadoEm: new Date(),
      })
      const refresh = await createRefresh(target.id)
      const secondRefresh = await createRefresh(target.id)
      const otherRefresh = await createRefresh(otherAccount.id, otherTenantId)
      const newEmail = `${randomUUID()}@new.example.test`
      expect((await begin(target.id, newEmail, managerToken, locale)).status).toBe(204)
      const { stored, code, message } = await proofFor(target.id)
      const linkText = message?.text?.match(/https?:\/\/[^\s]+/)?.[0]
      expect(linkText).toBeDefined()
      const link = new URL(linkText!)
      expect(link.origin).toBe(new URL(process.env.NEXTAUTH_URL!).origin)
      expect(link.pathname).toBe(`${prefix}confirm-email-change`)
      expect([...link.searchParams.keys()]).toEqual(['request'])
      expect(link.searchParams.get('request')).toBe(stored.id)
      expect(link.searchParams.has('code')).toBe(false)
      expect((await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).email).toBe(
        target.email,
      )
      expect(stored.codeHash).not.toBe(code)
      const response = await confirmPublic(request({ requestId: stored.id, code }))
      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')
      const changed = await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })
      expect(changed.email).toBe(newEmail)
      expect(changed.emailVerificadoEm).not.toBeNull()
      expect(changed.versaoSessao).toBe(target.versaoSessao + 1)
      expect(changed.papel).toBe(target.papel)
      expect(changed.ativo).toBe(target.ativo)
      expect(changed.vinculoAprovadoEm).toBeNull()
      expect(
        (await prisma.refreshToken.findUniqueOrThrow({ where: { id: refresh.id } })).revokedAt,
      ).not.toBeNull()
      expect(
        (await prisma.refreshToken.findUniqueOrThrow({ where: { id: secondRefresh.id } }))
          .revokedAt,
      ).not.toBeNull()
      expect(
        (await prisma.refreshToken.findUniqueOrThrow({ where: { id: otherRefresh.id } })).revokedAt,
      ).toBeNull()
      expect(
        (await prisma.usuario.findUniqueOrThrow({ where: { id: otherAccount.id } })).email,
      ).toBe(target.email)
      expect(await prisma.refreshToken.count({ where: { userId: target.id } })).toBe(2)
    },
  )

  it('rejects non-manager escalation, cross-tenant targets and missing authentication before sending a code', async () => {
    const target = await createUser()
    const agent = await createUser({ emailVerificadoEm: new Date(), vinculoAprovadoEm: new Date() })
    const otherTarget = await createUser({ tenantId: otherTenantId })
    const agentToken = await tokenFor(agent.id)
    expect((await begin(target.id, `${randomUUID()}@new.example.test`, agentToken)).status).toBe(
      403,
    )
    expect((await begin(otherTarget.id, `${randomUUID()}@new.example.test`)).status).toBe(404)
    expect(
      (
        await requestManager(request({ email: 'new@example.test', locale: 'pt-BR' }), {
          params: Promise.resolve({ id: target.id }),
        })
      ).status,
    ).toBe(401)
    expect(send).not.toHaveBeenCalled()
    expect(
      await prisma.emailVerificationCode.count({
        where: { userId: { in: [target.id, otherTarget.id] } },
      }),
    ).toBe(0)
  })

  it('requires both an email-change request and its code without trusting client account fields', async () => {
    const target = await createUser()
    await begin(target.id, `${randomUUID()}@new.example.test`)
    const { stored, code } = await proofFor(target.id)
    expect((await confirmPublic(request({ requestId: stored.id }))).status).toBe(400)
    expect(
      (await confirmPublic(request({ requestId: stored.id, code, tenantId: otherTenantId })))
        .status,
    ).toBe(400)
    expect((await confirmPublic(request({ requestId: 'missing', code }))).status).toBe(400)
    await prisma.emailVerificationCode.update({
      where: { id: stored.id },
      data: { purpose: 'SIGNUP' },
    })
    expect((await confirmPublic(request({ requestId: stored.id, code }))).status).toBe(400)
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).email).toBe(
      target.email,
    )
  })

  it('limits invalid attempts to five and never updates the account on failed proof', async () => {
    const target = await createUser()
    await begin(target.id, `${randomUUID()}@new.example.test`)
    const { stored, code } = await proofFor(target.id)
    const incorrect = code === '000000' ? '000001' : '000000'
    for (let index = 0; index < 5; index++) {
      expect((await confirmPublic(request({ requestId: stored.id, code: incorrect }))).status).toBe(
        400,
      )
    }
    expect((await confirmPublic(request({ requestId: stored.id, code }))).status).toBe(400)
    expect(
      (await prisma.emailVerificationCode.findUniqueOrThrow({ where: { id: stored.id } })).attempts,
    ).toBe(5)
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).email).toBe(
      target.email,
    )
  })

  it('rejects expired proof and prevents activating an inactive account during confirmation', async () => {
    const target = await createUser({ ativo: false })
    const newEmail = `${randomUUID()}@new.example.test`
    expect((await begin(target.id, newEmail)).status).toBe(204)
    const { stored, code } = await proofFor(target.id)
    await prisma.emailVerificationCode.update({
      where: { id: stored.id },
      data: { expiresAt: new Date(Date.now() - 1) },
    })
    expect((await confirmPublic(request({ requestId: stored.id, code }))).status).toBe(400)
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).email).toBe(
      target.email,
    )
    await prisma.emailVerificationCode.update({
      where: { id: stored.id },
      data: { expiresAt: new Date(Date.now() + 60_000) },
    })
    expect((await confirmPublic(request({ requestId: stored.id, code }))).status).toBe(204)
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).ativo).toBe(false)
  })

  it('consumes proof once under concurrent confirmation and rejects replay', async () => {
    const target = await createUser()
    await begin(target.id, `${randomUUID()}@new.example.test`)
    const { stored, code } = await proofFor(target.id)
    const responses = await Promise.all([
      confirmPublic(request({ requestId: stored.id, code })),
      confirmPublic(request({ requestId: stored.id, code })),
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([204, 400])
    expect((await confirmPublic(request({ requestId: stored.id, code }))).status).toBe(400)
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).versaoSessao,
    ).toBe(target.versaoSessao + 1)
  })

  it('enforces resend cooldown and invalidates the preceding request on replacement', async () => {
    const target = await createUser()
    const newEmail = `${randomUUID()}@new.example.test`
    await begin(target.id, newEmail)
    const first = await proofFor(target.id)
    expect((await begin(target.id, newEmail)).status).toBe(429)
    await prisma.emailVerificationCode.update({
      where: { id: first.stored.id },
      data: { createdAt: new Date(Date.now() - 61_000) },
    })
    expect((await begin(target.id, newEmail)).status).toBe(204)
    const second = await proofFor(target.id)
    expect(second.stored.id).not.toBe(first.stored.id)
    expect(
      (await confirmPublic(request({ requestId: first.stored.id, code: first.code }))).status,
    ).toBe(400)
    expect(
      (await confirmPublic(request({ requestId: second.stored.id, code: second.code }))).status,
    ).toBe(204)
  })

  it('keeps the existing authenticated self flow working', async () => {
    const target = await createUser({ papel: 'RENTER', emailVerificadoEm: new Date() })
    const token = await tokenFor(target.id)
    const email = `${randomUUID()}@new.example.test`
    expect((await requestSelf(request({ email, locale: 'pt-BR' }, token))).status).toBe(204)
    const { code } = await proofFor(target.id)
    expect((await confirmSelf(request({ email, code }, token))).status).toBe(204)
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).email).toBe(email)
    expect(
      (await requestSelf(request({ email: 'another@example.test', locale: 'pt-BR' }, token)))
        .status,
    ).toBe(401)
  })
})
