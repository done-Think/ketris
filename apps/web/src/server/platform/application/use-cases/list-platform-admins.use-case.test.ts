import { describe, expect, it, vi } from 'vitest'

import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import { ListPlatformAdminsUseCase } from './list-platform-admins.use-case'

const admins: PlatformAdmin[] = [
  { id: 'p1', nome: 'Dono', email: 'dono@ketris.dev', senhaHash: 'h1', ativo: true },
  { id: 'p2', nome: 'Sócio', email: 'socio@ketris.dev', senhaHash: 'h2', ativo: true },
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
    }
    const useCase = new ListPlatformAdminsUseCase(platformAdminRepository)

    const result = await useCase.execute()

    expect(result).toHaveLength(2)
    expect(result.every((admin) => !('senhaHash' in admin))).toBe(true)
  })
})
