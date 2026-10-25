import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@server/shared/email/ses-mailer', () => ({
  SesMailer: class {
    send = send
  },
}))

import { prisma } from '@server/db/prisma'
import { hashPasswordResetCode } from '@server/auth/domain/password-reset-code'
import { POST as requestCode } from '../../../password-reset-codes/route'
import { POST as verifyCode } from '../../../password-reset-codes/verify/route'

describe('POST /auth/password-reset-codes mailbox ownership integration', () => {
  const email = `request-proof-${randomUUID()}@example.test`
  const tenantIds: string[] = []
  beforeAll(async () => {
    for (const name of ['First account', 'Second account']) {
      const tenant = await prisma.tenant.create({
        data: { nome: name, slug: `request-proof-${randomUUID()}` },
      })
      tenantIds.push(tenant.id)
      await prisma.usuario.create({
        data: {
          tenantId: tenant.id,
          nome: 'Mailbox fixture',
          email,
          senhaHash: 'original',
          papel: 'OWNER',
        },
      })
    }
  })
  afterAll(async () => {
    await prisma.emailOwnershipCode.deleteMany({ where: { email } })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })
  function request(path: string, value: unknown) {
    return new NextRequest(`http://localhost/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    })
  }
  it('sends one mocked mailbox message and only then reveals accounts after the code is proved', async () => {
    const response = await requestCode(request('password-reset-codes', { email, locale: 'pt-BR' }))
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(send).toHaveBeenCalledTimes(1)
    const message = send.mock.calls[0][0]
    const code = `${message.text} ${message.html}`.match(/\b\d{6}\b/)?.[0]
    expect(code).toBeDefined()
    const saved = await prisma.emailOwnershipCode.findFirstOrThrow({ where: { email } })
    expect(saved.codeHash).toBe(hashPasswordResetCode(code!))
    expect(saved.codeHash).not.toBe(code)
    const verified = await verifyCode(request('password-reset-codes/verify', { email, code }))
    const choices = await verified.json()
    expect(verified.status).toBe(200)
    expect(choices.outcome).toBe('SELECT_TENANT')
    expect(choices.tenants).toHaveLength(2)
    expect(choices).not.toHaveProperty('resetToken')
  })
  it('keeps cooldown and unknown-mailbox responses identical and sends no additional messages', async () => {
    const cooldown = await requestCode(request('password-reset-codes', { email, locale: 'pt-BR' }))
    const unknown = await requestCode(
      request('password-reset-codes', {
        email: `unknown-${randomUUID()}@example.test`,
        locale: 'pt-BR',
      }),
    )
    expect(cooldown.status).toBe(204)
    expect(unknown.status).toBe(204)
    expect(await cooldown.text()).toBe(await unknown.text())
    expect(send).toHaveBeenCalledTimes(1)
  })
})
