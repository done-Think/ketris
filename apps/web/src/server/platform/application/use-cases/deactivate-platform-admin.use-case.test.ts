import { describe, expect, it, vi } from 'vitest'

import { CannotDeactivateSelfError, PlatformAdminNotFoundError } from '../../domain/errors'
import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../ports/platform-refresh-token-repository.port'
import { DeactivatePlatformAdminUseCase } from './deactivate-platform-admin.use-case'

const target: PlatformAdmin = {
  id: 'platform-admin-2',
  nome: 'Sócio Ketris',
  email: 'socio@ketris.dev',
  senhaHash: 'hash-fake',
  ativo: true,
}

function createDeps(overrides?: { findById?: PlatformAdminRepository['findById'] }) {
  const platformAdminRepository: PlatformAdminRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(target),
    findByEmail: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn().mockResolvedValue({ ...target, ativo: false }),
  }
  const refreshTokenRepository: PlatformRefreshTokenRepository = {
    create: vi.fn(),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForPlatformAdmin: vi.fn().mockResolvedValue(undefined),
  }

  return { platformAdminRepository, refreshTokenRepository }
}

describe('DeactivatePlatformAdminUseCase', () => {
  it('desativa o alvo e revoga todos os refresh tokens dele', async () => {
    const deps = createDeps()
    const useCase = new DeactivatePlatformAdminUseCase(
      deps.platformAdminRepository,
      deps.refreshTokenRepository,
    )

    const result = await useCase.execute({
      actorId: 'platform-admin-1',
      platformAdminId: target.id,
    })

    expect(result.ativo).toBe(false)
    expect(deps.refreshTokenRepository.revokeAllForPlatformAdmin).toHaveBeenCalledWith(target.id)
  })

  it('lança CannotDeactivateSelfError quando o ator tenta se autodesativar', async () => {
    const deps = createDeps()
    const useCase = new DeactivatePlatformAdminUseCase(
      deps.platformAdminRepository,
      deps.refreshTokenRepository,
    )

    await expect(
      useCase.execute({ actorId: target.id, platformAdminId: target.id }),
    ).rejects.toThrow(CannotDeactivateSelfError)
    expect(deps.platformAdminRepository.deactivate).not.toHaveBeenCalled()
  })

  it('lança PlatformAdminNotFoundError quando o alvo não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new DeactivatePlatformAdminUseCase(
      deps.platformAdminRepository,
      deps.refreshTokenRepository,
    )

    await expect(
      useCase.execute({ actorId: 'platform-admin-1', platformAdminId: 'inexistente' }),
    ).rejects.toThrow(PlatformAdminNotFoundError)
  })
})
