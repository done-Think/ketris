import { describe, expect, it, vi } from 'vitest'

import type { PlatformAdmin } from '../../../types/platform-admin'
import type { PlatformAdminRepository } from '../../../application/ports/platform-admin-repository.port'
import { ListPlatformAdminsUseCase } from '../../../application/use-cases/list-platform-admins.use-case'

const admins: PlatformAdmin[] = [
  {
    id: 'p1',
    name: 'Dono',
    email: 'dono@ketris.dev',
    passwordHash: 'h1',
    role: 'ADMIN',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastAccessAt: new Date('2026-10-27T12:00:00.000Z'),
  },
  {
    id: 'p2',
    name: 'Sócio',
    email: 'socio@ketris.dev',
    passwordHash: 'h2',
    role: 'AGENT',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastAccessAt: null,
  },
]

describe('ListPlatformAdminsUseCase', () => {
  it('retorna todos os platform admins sem senhaHash', async () => {
    const platformAdminRepository: PlatformAdminRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findMany: vi.fn().mockResolvedValue(admins),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
      recordAccess: vi.fn(),
    }
    const useCase = new ListPlatformAdminsUseCase(platformAdminRepository)

    const result = await useCase.execute()

    expect(result).toHaveLength(2)
    expect(result.every((admin) => !('passwordHash' in admin))).toBe(true)
  })
})
