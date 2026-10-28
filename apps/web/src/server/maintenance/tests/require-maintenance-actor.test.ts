// @vitest-environment node
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { UnauthorizedError } from '@server/shared/errors'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireMaintenanceActor } from '../require-maintenance-actor'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@shared/lib/auth/auth-options', () => ({ authOptions: {} }))
vi.mock('@server/auth/container', () => ({
  authContainer: { tokenService: {}, userRepository: { findById: vi.fn() } },
}))
vi.mock('@server/auth/require-bearer-auth', () => ({ requireBearerAuth: vi.fn() }))
const user = {
  id: 'user',
  tenantId: 'tenant',
  name: 'User',
  email: 'user@example.test',
  passwordHash: 'hash',
  role: 'RENTER' as const,
  active: true,
  membershipApprovedAt: new Date(),
}
const request = () =>
  new NextRequest('http://localhost/api/maintenance/tickets', {
    headers: { authorization: 'Bearer token' },
  })
describe('Maintenance authenticated actor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireBearerAuth).mockResolvedValue({
      sub: 'user',
      tenantId: 'tenant',
      role: 'OWNER',
    })
    vi.mocked(authContainer.userRepository.findById).mockResolvedValue(user)
  })
  it('uses fresh role and author identity from database, not stale token privileges', async () => {
    expect(await requireMaintenanceActor(request())).toEqual({
      actorId: 'user',
      actorTenantId: 'tenant',
      actorName: 'User',
      actorRole: 'RENTER',
    })
  })
  it.each([
    null,
    { ...user, active: false },
    { ...user, membershipApprovedAt: null },
    { ...user, tenantId: 'other' },
  ])('rejects invalid or unapproved user %#', async (invalid) => {
    vi.mocked(authContainer.userRepository.findById).mockResolvedValue(invalid)
    await expect(requireMaintenanceActor(request())).rejects.toBeInstanceOf(UnauthorizedError)
  })
  it('accepts a tenant cookie session only where explicitly enabled', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      scope: 'tenant',
      tenantId: 'tenant',
      user: { id: 'user' },
      expires: '',
    })
    const media = new NextRequest(
      'http://localhost/api/maintenance/media/maintenance/tenant/file.png',
    )
    expect((await requireMaintenanceActor(media, true)).actorId).toBe('user')
    expect(requireBearerAuth).not.toHaveBeenCalled()
  })
  it('refuses a platform session and does not fall back from invalid bearer to a cookie', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      scope: 'platform',
      user: { id: 'platform' },
      expires: '',
    })
    await expect(
      requireMaintenanceActor(new NextRequest('http://localhost/media'), true),
    ).rejects.toBeInstanceOf(UnauthorizedError)
    vi.mocked(requireBearerAuth).mockRejectedValue(new UnauthorizedError())
    await expect(requireMaintenanceActor(request(), true)).rejects.toBeInstanceOf(UnauthorizedError)
    expect(getServerSession).toHaveBeenCalledTimes(1)
  })
})
