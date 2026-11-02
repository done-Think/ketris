// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ user: vi.fn(), token: vi.fn(), session: vi.fn() }))
vi.mock('@server/db/prisma', () => ({ prisma: { user: { findFirst: mocks.user } } }))
vi.mock('@server/auth/container', () => ({ authContainer: { tokenService: {} } }))
vi.mock('@server/auth/require-bearer-auth', () => ({ requireBearerAuth: mocks.token }))
vi.mock('@shared/lib/auth/auth-options', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))

import { requireFaceCheckActor } from '../require-face-check-actor'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.token.mockResolvedValue({ sub: 'user', tenantId: 'tenant', role: 'OWNER' })
  mocks.user.mockResolvedValue({
    id: 'user',
    tenantId: 'tenant',
    role: 'AGENT',
    tenant: { name: 'Tenant', accountType: 'AGENCY' },
  })
})

describe('face_check request identity', () => {
  it('uses freshly loaded role and eligibility instead of token role or caller fields', async () => {
    const actor = await requireFaceCheckActor(
      new NextRequest('https://app.test/api/face_check/access?tenantId=other&role=OWNER', {
        headers: { authorization: 'Bearer signed' },
      }),
    )
    expect(actor).toMatchObject({ actorId: 'user', tenantId: 'tenant', role: 'AGENT' })
    expect(mocks.user).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'user',
          tenantId: 'tenant',
          active: true,
          emailVerifiedAt: { not: null },
          membershipApprovedAt: { not: null },
          role: { in: ['OWNER', 'AGENT'] },
          tenant: {
            status: { in: ['ACTIVE', 'TRIAL'] },
            accountType: { in: ['AGENCY', 'BROKER'] },
          },
        }),
      }),
    )
    mocks.user.mockResolvedValueOnce(null)
    await expect(
      requireFaceCheckActor(
        new NextRequest('https://app.test/api', { headers: { authorization: 'Bearer signed' } }),
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('rejects platform and absent browser sessions', async () => {
    mocks.session.mockResolvedValueOnce({
      scope: 'platform',
      user: { id: 'admin' },
      tenantId: 'tenant',
    })
    await expect(
      requireFaceCheckActor(new NextRequest('https://app.test/api')),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 })
    mocks.session.mockResolvedValueOnce(null)
    await expect(
      requireFaceCheckActor(new NextRequest('https://app.test/api')),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(mocks.user).not.toHaveBeenCalled()
  })

  it('supports a tenant browser session and does not fall back when a bearer header is supplied', async () => {
    mocks.session.mockResolvedValueOnce({
      scope: 'tenant',
      user: { id: 'user' },
      tenantId: 'tenant',
    })
    expect((await requireFaceCheckActor(new NextRequest('https://app.test/api'))).role).toBe(
      'AGENT',
    )
    mocks.token.mockRejectedValueOnce(new Error('invalid bearer'))
    await expect(
      requireFaceCheckActor(
        new NextRequest('https://app.test/api', { headers: { authorization: 'Bearer invalid' } }),
      ),
    ).rejects.toThrow('invalid bearer')
    expect(mocks.session).toHaveBeenCalledTimes(1)
  })
})
