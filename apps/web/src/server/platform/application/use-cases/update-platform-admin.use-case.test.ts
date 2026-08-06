import { describe, expect, it, vi } from 'vitest'

import {
  PlatformAdminEmailAlreadyInUseError,
  PlatformAdminNotFoundError,
} from '../../domain/errors'
import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import { UpdatePlatformAdminUseCase } from './update-platform-admin.use-case'

const admin: PlatformAdmin = {
  id: 'platform-admin-1',
  nome: 'Dono Ketris',
  email: 'dono@ketris.dev',
  senhaHash: 'hash-fake',
  ativo: true,
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
    update: vi.fn().mockResolvedValue({ ...admin, nome: 'Novo Nome' }),
    deactivate: vi.fn(),
  }

  return { platformAdminRepository }
}

describe('UpdatePlatformAdminUseCase', () => {
  it('atualiza nome/e-mail quando o platform admin existe', async () => {
    const deps = createDeps()
    const useCase = new UpdatePlatformAdminUseCase(deps.platformAdminRepository)

    const result = await useCase.execute({ platformAdminId: admin.id, nome: 'Novo Nome' })

    expect(result.nome).toBe('Novo Nome')
    expect(deps.platformAdminRepository.update).toHaveBeenCalledWith(admin.id, {
      nome: 'Novo Nome',
      email: undefined,
    })
  })

  it('lança PlatformAdminNotFoundError quando o alvo não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdatePlatformAdminUseCase(deps.platformAdminRepository)

    await expect(useCase.execute({ platformAdminId: 'inexistente', nome: 'X' })).rejects.toThrow(
      PlatformAdminNotFoundError,
    )
  })

  it('lança PlatformAdminEmailAlreadyInUseError quando o novo e-mail já está em uso', async () => {
    const deps = createDeps({
      findByEmail: vi.fn().mockResolvedValue({ ...admin, id: 'outro-id' }),
    })
    const useCase = new UpdatePlatformAdminUseCase(deps.platformAdminRepository)

    await expect(
      useCase.execute({ platformAdminId: admin.id, email: 'outro@ketris.dev' }),
    ).rejects.toThrow(PlatformAdminEmailAlreadyInUseError)
    expect(deps.platformAdminRepository.update).not.toHaveBeenCalled()
  })
})
