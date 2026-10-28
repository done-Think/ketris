import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { authContainer } from '@server/auth/container'
import { prisma } from '@server/db/prisma'
import { SesMailer } from '@server/shared/email/ses-mailer'
import { POST as register } from '../route'
import { POST as login } from '../../auth/login/route'
import { POST as confirm } from '../../auth/email-verification-codes/verify/route'

const send = vi.spyOn(SesMailer.prototype, 'send').mockResolvedValue(undefined)
const tenants: string[] = []
function request(path: string, body: unknown) {
  return new NextRequest(`http://localhost/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
function details() {
  return {
    fullName: `Cadastro ${randomUUID()}`,
    email: `${randomUUID()}@signup.example.test`,
    phone: '(11) 99999-9999',
    password: 'senha-longa-123',
    acceptTerms: true,
    locale: 'pt-BR',
  }
}
function latestCode() {
  const code = send.mock.calls.at(-1)?.[0].text?.match(/\b\d{6}\b/)?.[0]
  if (!code) throw new Error('E-mail sem código de confirmação')
  return code
}

describe('cadastro e primeiro login com confirmação real', () => {
  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue(undefined)
  })
  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: tenants } } })
    send.mockRestore()
  })

  it('persiste telefone e aceite, não emite sessão antecipada e permite confirmar uma única vez', async () => {
    const input = { ...details(), profile: 'owner' }
    const response = await register(request('register', input))
    expect(response.status).toBe(201)
    const body = await response.json()
    tenants.push(body.tenantId)
    expect(body.outcome).toBe('PENDING_EMAIL_VERIFICATION')
    expect(body.emailSent).toBe(true)
    expect('accessToken' in body).toBe(false)
    const user = await prisma.user.findUniqueOrThrow({
      where: { tenantId_email: { tenantId: body.tenantId, email: input.email } },
    })
    expect(user.phone).toBe(input.phone)
    expect(user.termsAcceptedAt).not.toBeNull()
    expect(user.emailVerifiedAt).toBeNull()
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
    const code = latestCode()
    const unverifiedLogin = await login(
      request('auth/login', { email: input.email, password: input.password }),
    )
    expect((await unverifiedLogin.json()).outcome).toBe('PENDING_EMAIL_VERIFICATION')
    expect(send).toHaveBeenCalledTimes(1)
    const verified = await confirm(
      request('auth/email-verification-codes/verify', {
        email: input.email,
        tenantId: body.tenantId,
        code,
      }),
    )
    expect(verified.status).toBe(200)
    const result = await verified.json()
    expect(result.outcome).toBe('REGISTERED')
    expect(typeof result.accessToken).toBe('string')
    expect(
      (
        await confirm(
          request('auth/email-verification-codes/verify', {
            email: input.email,
            tenantId: body.tenantId,
            code,
          }),
        )
      ).status,
    ).toBe(400)
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1)
  })

  it('inicializa perfil público do corretor com telefone e CRECI reais sem publicá-lo', async () => {
    const input = { ...details(), profile: 'broker', creci: '12345-F' }
    const response = await register(request('register', input))
    expect(response.status).toBe(201)
    const body = await response.json()
    tenants.push(body.tenantId)
    const user = await prisma.user.findUniqueOrThrow({
      where: { tenantId_email: { tenantId: body.tenantId, email: input.email } },
    })
    const profile = await prisma.brokerPublicProfile.findUniqueOrThrow({
      where: { userId: user.id },
    })
    expect(user.creci).toBe(input.creci)
    expect(profile.phone).toBe(input.phone)
    expect(profile.creci).toBe(input.creci)
    expect(profile.status).toBe('DRAFT')
  })

  it('exige tanto confirmação de e-mail quanto aprovação para novo vínculo de corretor', async () => {
    const agency = await prisma.tenant.create({
      data: {
        name: 'Imobiliária elegível',
        slug: `agency-${randomUUID()}`,
        accountType: 'AGENCY',
        status: 'ACTIVE',
      },
    })
    tenants.push(agency.id)
    const input = { ...details(), profile: 'broker', creci: '12345-F', agencyId: agency.id }
    const response = await register(request('register', input))
    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.outcome).toBe('PENDING_EMAIL_VERIFICATION')
    const verified = await confirm(
      request('auth/email-verification-codes/verify', {
        email: input.email,
        tenantId: agency.id,
        code: latestCode(),
      }),
    )
    expect((await verified.json()).outcome).toBe('PENDING_APPROVAL')
    const user = await prisma.user.findUniqueOrThrow({
      where: { tenantId_email: { tenantId: agency.id, email: input.email } },
    })
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
    expect(user.membershipApprovedAt).toBeNull()
  })

  it('também exige confirmação para contas criadas pela gestão', async () => {
    const agency = await prisma.tenant.create({
      data: {
        name: 'Gestão',
        slug: `managed-${randomUUID()}`,
        accountType: 'AGENCY',
        status: 'ACTIVE',
      },
    })
    tenants.push(agency.id)
    const input = details()
    const manager = await prisma.user.create({
      data: {
        tenantId: agency.id,
        name: 'Gestor',
        email: `${randomUUID()}@manager.example.test`,
        passwordHash: 'test-only',
        role: 'OWNER',
      },
    })
    const managed = await authContainer.createUserUseCase.execute({
      actorId: manager.id,
      actorTenantId: agency.id,
      actorRole: 'OWNER',
      name: input.fullName,
      email: input.email,
      password: input.password,
      role: 'PROPERTY_OWNER',
    })
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: managed.id } })).emailVerifiedAt,
    ).toBeNull()
    const response = await login(
      request('auth/login', { email: input.email, password: input.password }),
    )
    expect((await response.json()).outcome).toBe('PENDING_EMAIL_VERIFICATION')
    expect(await prisma.refreshToken.count({ where: { userId: managed.id } })).toBe(0)
    const verified = await confirm(
      request('auth/email-verification-codes/verify', {
        email: input.email,
        tenantId: agency.id,
        code: latestCode(),
      }),
    )
    expect(verified.status).toBe(200)
    expect((await verified.json()).outcome).toBe('REGISTERED')
  })

  it('preserva conta e código quando o envio falha, sem fornecer tokens', async () => {
    send.mockRejectedValueOnce(new Error('Falha de entrega simulada'))
    const input = { ...details(), profile: 'owner' }
    const response = await register(request('register', input))
    expect(response.status).toBe(201)
    const body = await response.json()
    tenants.push(body.tenantId)
    expect(body.emailSent).toBe(false)
    expect('accessToken' in body).toBe(false)
    expect(
      await prisma.user.count({ where: { tenantId: body.tenantId, email: input.email } }),
    ).toBe(1)
    expect(await prisma.emailVerificationCode.count({ where: { tenantId: body.tenantId } })).toBe(1)
  })

  it('rejeita campos não suportados, ausência de aceite e senha maior que 72 bytes antes de gravar', async () => {
    const input = { ...details(), profile: 'owner' }
    for (const invalid of [
      { ...input, acceptTerms: false },
      { ...input, password: 'é'.repeat(37) },
      { ...input, passwordConfirmation: input.password },
    ]) {
      expect((await register(request('register', invalid))).status).toBe(400)
    }
    expect(await prisma.user.count({ where: { email: input.email } })).toBe(0)
    expect(send).not.toHaveBeenCalled()
  })
})
