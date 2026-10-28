import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { POST } from '../../me/avatar/route'

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }))
vi.mock('@server/auth/infrastructure/s3-avatar-storage', () => ({
  S3AvatarStorage: class {
    upload = upload
  },
}))

describe('POST /auth/me/avatar', () => {
  let tenantId: string
  let userId: string
  let token: string
  const tokenService = new JoseTokenService()
  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Avatar test', slug: `avatar-${randomUUID()}` },
    })
    tenantId = tenant.id
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'Locatário',
        email: `avatar-${randomUUID()}@example.test`,
        passwordHash: 'hash',
        role: 'RENTER',
      },
    })
    userId = user.id
    token = await tokenService.sign({
      id: user.id,
      tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      membershipApprovedAt: user.membershipApprovedAt,
    })
  })
  beforeEach(() => {
    vi.clearAllMocks()
    upload.mockResolvedValue({
      url: `/api/auth/media/avatars/${tenantId}/${userId}/avatar.png`,
      contentType: 'image/png',
    })
  })
  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
  })

  function request(authToken?: string) {
    const body = new FormData()
    body.set('file', new File(['image'], 'avatar.png', { type: 'image/png' }))
    body.set('userId', 'another-user')
    body.set('tenantId', 'another-tenant')
    return new NextRequest('http://localhost/api/auth/me/avatar', {
      method: 'POST',
      headers: authToken ? { authorization: `Bearer ${authToken}` } : {},
      body,
    })
  }

  it('allows RENTER to upload to the authenticated user namespace regardless of submitted IDs', async () => {
    const response = await POST(request(token))
    expect(response.status).toBe(201)
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ tenantId, userId }))
    expect((await response.json()).media.url).toContain(`/avatars/${tenantId}/${userId}/`)
  })
  it('requires authentication before accepting the upload', async () => {
    expect((await POST(request())).status).toBe(401)
    expect(upload).not.toHaveBeenCalled()
  })
  it('rejects an inactive user even if the bearer token is still valid', async () => {
    await prisma.user.update({ where: { id: userId }, data: { active: false } })
    expect((await POST(request(token))).status).toBe(403)
    expect(upload).not.toHaveBeenCalled()
  })
})
