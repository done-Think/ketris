import { describe, expect, it, vi } from 'vitest'

import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import { PlatformAdminEmailAlreadyInUseError } from '../../../domain/errors'
import type { PlatformAdmin } from '../../../types/platform-admin'
import type { PlatformAdminRepository } from '../../../application/ports/platform-admin-repository.port'
import { CreatePlatformAdminUseCase } from '../../../application/use-cases/create-platform-admin.use-case'

const existingAdmin: PlatformAdmin = {
  id: 'platform-admin-1',
  name: 'Dono Ketris',
  email: 'dono@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'ADMIN',
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  lastAccessAt: null,
}

const createdAdmin: PlatformAdmin = {
  id: 'platform-admin-2',
  name: 'Sócio Ketris',
  email: 'socio@ketris.dev',
  passwordHash: 'hash-novo',
  role: 'ADMIN',
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  lastAccessAt: null,
}

function createDeps(overrides?: { findByEmail?: PlatformAdminRepository['findByEmail'] }) {
  const platformAdminRepository: PlatformAdminRepository = {
    findById: vi.fn(),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(null),
    findMany: vi.fn(),
    create: vi.fn().mockResolvedValue(createdAdmin),
    update: vi.fn(),
    deactivate: vi.fn(),
    recordAccess: vi.fn(),
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
      actorId: 'acting-admin',
      name: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      password: 'senha-longa-123',
      role: 'ADMIN_AGENT',
    })

    expect(result).not.toHaveProperty('passwordHash')
    expect(deps.platformAdminRepository.create).toHaveBeenCalledWith(
      {
        name: 'Sócio Ketris',
        email: 'socio@ketris.dev',
        passwordHash: 'hash-novo',
        role: 'ADMIN_AGENT',
      },
      'acting-admin',
    )
  })

  it('lança PlatformAdminEmailAlreadyInUseError quando já existe um platform admin com o e-mail', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(existingAdmin) })
    const useCase = new CreatePlatformAdminUseCase(
      deps.platformAdminRepository,
      deps.passwordHasher,
    )

    await expect(
      useCase.execute({
        actorId: 'acting-admin',
        name: 'X',
        email: existingAdmin.email,
        password: 'senha-longa-123',
        role: 'ADMIN',
      }),
    ).rejects.toThrow(PlatformAdminEmailAlreadyInUseError)
    expect(deps.platformAdminRepository.create).not.toHaveBeenCalled()
  })
})
