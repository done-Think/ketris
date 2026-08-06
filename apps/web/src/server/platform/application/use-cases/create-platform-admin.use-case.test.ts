import { describe, expect, it, vi } from 'vitest'

import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import { PlatformAdminEmailAlreadyInUseError } from '../../domain/errors'
import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import { CreatePlatformAdminUseCase } from './create-platform-admin.use-case'

const existingAdmin: PlatformAdmin = {
  id: 'platform-admin-1',
  nome: 'Dono Ketris',
  email: 'dono@ketris.dev',
  senhaHash: 'hash-fake',
  ativo: true,
}

const createdAdmin: PlatformAdmin = {
  id: 'platform-admin-2',
  nome: 'Sócio Ketris',
  email: 'socio@ketris.dev',
  senhaHash: 'hash-novo',
  ativo: true,
}

function createDeps(overrides?: { findByEmail?: PlatformAdminRepository['findByEmail'] }) {
  const platformAdminRepository: PlatformAdminRepository = {
    findById: vi.fn(),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(null),
    findMany: vi.fn(),
    create: vi.fn().mockResolvedValue(createdAdmin),
    update: vi.fn(),
    deactivate: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { platformAdminRepository, passwordHasher }
}

describe('CreatePlatformAdminUseCase', () => {
  it('cria um platform admin quando o e-mail ainda não existe', async () => {
    const deps = createDeps()
    const useCase = new CreatePlatformAdminUseCase(
      deps.platformAdminRepository,
      deps.passwordHasher,
    )

    const result = await useCase.execute({
      nome: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result).not.toHaveProperty('senhaHash')
    expect(deps.platformAdminRepository.create).toHaveBeenCalledWith({
      nome: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      senhaHash: 'hash-novo',
    })
  })

  it('lança PlatformAdminEmailAlreadyInUseError quando já existe um platform admin com o e-mail', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(existingAdmin) })
    const useCase = new CreatePlatformAdminUseCase(
      deps.platformAdminRepository,
      deps.passwordHasher,
    )

    await expect(
      useCase.execute({ nome: 'X', email: existingAdmin.email, password: 'senha-longa-123' }),
    ).rejects.toThrow(PlatformAdminEmailAlreadyInUseError)
    expect(deps.platformAdminRepository.create).not.toHaveBeenCalled()
  })
})
