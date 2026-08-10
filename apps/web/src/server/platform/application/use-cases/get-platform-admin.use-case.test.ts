import { describe, expect, it, vi } from 'vitest'

import { PlatformAdminNotFoundError } from '../../domain/errors'
import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import { GetPlatformAdminUseCase } from './get-platform-admin.use-case'

const admin: PlatformAdmin = {
  id: 'platform-admin-1',
  nome: 'Dono Ketris',
  email: 'dono@ketris.dev',
  senhaHash: 'hash-fake',
  ativo: true,
}

function createRepository(findById?: PlatformAdminRepository['findById']): PlatformAdminRepository {
  return {
    findById: findById ?? vi.fn().mockResolvedValue(admin),
    findByEmail: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  }
}

describe('GetPlatformAdminUseCase', () => {
  it('retorna o platform admin sem senhaHash', async () => {
    const useCase = new GetPlatformAdminUseCase(createRepository())

    const result = await useCase.execute({ platformAdminId: admin.id })

    expect(result).not.toHaveProperty('senhaHash')
    expect(result.id).toBe(admin.id)
  })

  it('lança PlatformAdminNotFoundError quando não existe', async () => {
    const useCase = new GetPlatformAdminUseCase(createRepository(vi.fn().mockResolvedValue(null)))

    await expect(useCase.execute({ platformAdminId: 'inexistente' })).rejects.toThrow(
      PlatformAdminNotFoundError,
    )
  })
})
