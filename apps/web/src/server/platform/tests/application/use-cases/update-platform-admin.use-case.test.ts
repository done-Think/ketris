import { describe, expect, it, vi } from 'vitest'

import {
  PlatformAdminEmailAlreadyInUseError,
  PlatformAdminNotFoundError,
} from '../../../domain/errors'
import type { PlatformAdmin } from '../../../types/platform-admin'
import type { PlatformAdminRepository } from '../../../application/ports/platform-admin-repository.port'
import { UpdatePlatformAdminUseCase } from '../../../application/use-cases/update-platform-admin.use-case'

const admin: PlatformAdmin = {
  id: 'platform-admin-1',
  name: 'Dono Ketris',
  email: 'dono@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'ADMIN',
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  lastAccessAt: null,
}

function createDeps(overrides?: {
  findById?: PlatformAdminRepository['findById']
  findByEmail?: PlatformAdminRepository['findByEmail']
}) {
  const platformAdminRepository: PlatformAdminRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(admin),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(null),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue({ ...admin, name: 'Novo Nome' }),
    deactivate: vi.fn(),
    recordAccess: vi.fn(),
  }

  return { platformAdminRepository }
}

describe('UpdatePlatformAdminUseCase', () => {
  it('atualiza nome/e-mail quando o platform admin existe', async () => {
    const deps = createDeps()
    const useCase = new UpdatePlatformAdminUseCase(deps.platformAdminRepository)

    const result = await useCase.execute({
      actorId: 'acting-admin',
      platformAdminId: admin.id,
      name: 'Novo Nome',
    })

    expect(result.name).toBe('Novo Nome')
    expect(deps.platformAdminRepository.update).toHaveBeenCalledWith(
      admin.id,
      {
        name: 'Novo Nome',
        email: undefined,
        role: undefined,
        active: undefined,
      },
      'acting-admin',
    )
  })

  it('reativa um platform admin inativo', async () => {
    const deps = createDeps()
    const useCase = new UpdatePlatformAdminUseCase(deps.platformAdminRepository)

    await useCase.execute({ actorId: 'acting-admin', platformAdminId: admin.id, active: true })

    expect(deps.platformAdminRepository.update).toHaveBeenCalledWith(
      admin.id,
      {
        name: undefined,
        email: undefined,
        role: undefined,
        active: true,
      },
      'acting-admin',
    )
  })

  it('lança PlatformAdminNotFoundError quando o alvo não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdatePlatformAdminUseCase(deps.platformAdminRepository)

    await expect(
      useCase.execute({ actorId: 'acting-admin', platformAdminId: 'inexistente', name: 'X' }),
    ).rejects.toThrow(PlatformAdminNotFoundError)
  })

  it('lança PlatformAdminEmailAlreadyInUseError quando o novo e-mail já está em uso', async () => {
    const deps = createDeps({
      findByEmail: vi.fn().mockResolvedValue({ ...admin, id: 'outro-id' }),
    })
    const useCase = new UpdatePlatformAdminUseCase(deps.platformAdminRepository)

    await expect(
      useCase.execute({
        actorId: 'acting-admin',
        platformAdminId: admin.id,
        email: 'outro@ketris.dev',
      }),
    ).rejects.toThrow(PlatformAdminEmailAlreadyInUseError)
    expect(deps.platformAdminRepository.update).not.toHaveBeenCalled()
  })
})
