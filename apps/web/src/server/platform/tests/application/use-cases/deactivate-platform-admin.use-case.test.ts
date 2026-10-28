import { describe, expect, it, vi } from 'vitest'

import { CannotDeactivateSelfError, PlatformAdminNotFoundError } from '../../../domain/errors'
import type { PlatformAdmin } from '../../../types/platform-admin'
import type { PlatformAdminRepository } from '../../../application/ports/platform-admin-repository.port'
import { DeactivatePlatformAdminUseCase } from '../../../application/use-cases/deactivate-platform-admin.use-case'

const target: PlatformAdmin = {
  id: 'platform-admin-2',
  name: 'Sócio Ketris',
  email: 'socio@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'ADMIN',
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  lastAccessAt: null,
}

function createDeps(overrides?: { findById?: PlatformAdminRepository['findById'] }) {
  const platformAdminRepository: PlatformAdminRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(target),
    findByEmail: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn().mockResolvedValue({ ...target, active: false }),
    recordAccess: vi.fn(),
  }

  return { platformAdminRepository }
}

describe('DeactivatePlatformAdminUseCase', () => {
  it('delegates guarded deactivation and token revocation to the atomic repository operation', async () => {
    const deps = createDeps()
    const useCase = new DeactivatePlatformAdminUseCase(deps.platformAdminRepository)

    const result = await useCase.execute({
      actorId: 'platform-admin-1',
      platformAdminId: target.id,
    })

    expect(result.active).toBe(false)
    expect(deps.platformAdminRepository.deactivate).toHaveBeenCalledWith(
      target.id,
      'platform-admin-1',
    )
  })

  it('lança CannotDeactivateSelfError quando o ator tenta se autodesativar', async () => {
    const deps = createDeps()
    const useCase = new DeactivatePlatformAdminUseCase(deps.platformAdminRepository)

    await expect(
      useCase.execute({ actorId: target.id, platformAdminId: target.id }),
    ).rejects.toThrow(CannotDeactivateSelfError)
    expect(deps.platformAdminRepository.deactivate).not.toHaveBeenCalled()
  })

  it('lança PlatformAdminNotFoundError quando o alvo não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new DeactivatePlatformAdminUseCase(deps.platformAdminRepository)

    await expect(
      useCase.execute({ actorId: 'platform-admin-1', platformAdminId: 'inexistente' }),
    ).rejects.toThrow(PlatformAdminNotFoundError)
  })
})
