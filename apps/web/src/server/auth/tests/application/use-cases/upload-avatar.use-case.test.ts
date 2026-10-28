import { describe, expect, it, vi } from 'vitest'

import type { User, UserRole } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { UploadAvatarUseCase } from '../../../application/use-cases/upload-avatar.use-case'
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Usuário',
  email: 'user@example.test',
  passwordHash: 'hash',
  role: 'RENTER',
  active: true,
  membershipApprovedAt: null,
  avatarUrl: null,
}
const input = {
  actorId: user.id,
  actorTenantId: user.tenantId,
  filename: 'avatar.png',
  contentType: 'image/png',
  body: Buffer.from('image'),
}

function dependencies(currentUser = user) {
  const users: UserRepository = {
    findManyByEmail: vi.fn(),

    findById: vi.fn().mockResolvedValue(currentUser),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(currentUser),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const storage = {
    upload: vi.fn().mockResolvedValue({
      url: '/api/auth/media/avatars/tenant-1/user-1/avatar.png',
      contentType: 'image/png',
    }),
  }
  return { users, storage, upload: new UploadAvatarUseCase(users, storage) }
}

describe('own avatar access', () => {
  it.each(['OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER'] satisfies UserRole[])(
    'allows active %s users to upload only to their own namespace',
    async (role) => {
      const deps = dependencies({ ...user, role })
      await deps.upload.execute(input)
      expect(deps.storage.upload).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: user.tenantId, userId: user.id }),
      )
    },
  )
  it('revalidates user activity and tenant before writing to storage', async () => {
    const inactive = dependencies({ ...user, active: false })
    await expect(inactive.upload.execute(input)).rejects.toMatchObject({
      code: 'ACCOUNT_DEACTIVATED',
    })
    expect(inactive.storage.upload).not.toHaveBeenCalled()
    const crossTenant = dependencies()
    await expect(
      crossTenant.upload.execute({ ...input, actorTenantId: 'tenant-2' }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
    expect(crossTenant.storage.upload).not.toHaveBeenCalled()
  })
  it.each([
    { body: Buffer.alloc(0) },
    { body: Buffer.alloc(8 * 1024 * 1024 + 1) },
    { contentType: 'text/html' },
  ])('rejects invalid uploads before storage access', async (invalid) => {
    const deps = dependencies()
    await expect(deps.upload.execute({ ...input, ...invalid })).rejects.toMatchObject({
      code: 'AVATAR_VALIDATION_ERROR',
    })
    expect(deps.storage.upload).not.toHaveBeenCalled()
  })
  it('does not let an administrator change another users avatar', async () => {
    const deps = dependencies()
    await expect(
      new UpdateUserUseCase(deps.users).execute({
        actorId: 'admin-1',
        actorTenantId: user.tenantId,
        actorRole: 'OWNER',
        userId: user.id,
        avatarUrl: '/api/auth/media/avatars/tenant-1/user-1/avatar.png',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.users.update).not.toHaveBeenCalled()
  })
  it('rejects another users media and accepts the users own uploaded avatar', async () => {
    const deps = dependencies()
    const update = new UpdateUserUseCase(deps.users)
    const base = {
      actorId: user.id,
      actorTenantId: user.tenantId,
      actorRole: user.role,
      userId: user.id,
    }
    await expect(
      update.execute({
        ...base,
        avatarUrl: '/api/auth/media/avatars/tenant-1/other-user/avatar.png',
      }),
    ).rejects.toMatchObject({ code: 'AVATAR_VALIDATION_ERROR' })
    expect(deps.users.update).not.toHaveBeenCalled()
    await update.execute({
      ...base,
      avatarUrl: '/api/auth/media/avatars/tenant-1/user-1/avatar.png',
    })
    expect(deps.users.update).toHaveBeenCalledOnce()
  })
})
