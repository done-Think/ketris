import { describe, expect, it, vi } from 'vitest'

import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import {
  PlatformAdminEmailAlreadyInUseError,
  PlatformAlreadyBootstrappedError,
} from '../../domain/errors'
import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import type {
  BootstrapPlatformAdminResult,
  PlatformBootstrapRepository,
} from '../ports/platform-bootstrap-repository.port'
import { BootstrapPlatformAdminUseCase } from './bootstrap-platform-admin.use-case'

const createdAdmin: PlatformAdmin = {
  id: 'platform-admin-1',
  nome: 'Primeiro Admin',
  email: 'dono@ketris.dev',
  senhaHash: 'hash-novo',
  ativo: true,
}

function createDeps(
  bootstrapFirstPlatformAdmin?: (...args: unknown[]) => Promise<BootstrapPlatformAdminResult>,
) {
  const bootstrapRepository: PlatformBootstrapRepository = {
    bootstrapFirstPlatformAdmin:
      bootstrapFirstPlatformAdmin ??
      vi.fn().mockResolvedValue({ status: 'created', admin: createdAdmin }),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { bootstrapRepository, passwordHasher }
}

describe('BootstrapPlatformAdminUseCase', () => {
  it('cria o platform admin quando o repository confirma o claim (nenhum admin ainda)', async () => {
    const deps = createDeps()
    const useCase = new BootstrapPlatformAdminUseCase(deps.bootstrapRepository, deps.passwordHasher)

    const result = await useCase.execute({
      nome: 'Primeiro Admin',
      email: 'dono@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result).not.toHaveProperty('senhaHash')
    expect(deps.bootstrapRepository.bootstrapFirstPlatformAdmin).toHaveBeenCalledWith({
      nome: 'Primeiro Admin',
      email: 'dono@ketris.dev',
      senhaHash: 'hash-novo',
    })
  })

  it('lança PlatformAlreadyBootstrappedError quando já existe um platform admin', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ status: 'already_bootstrapped' }))
    const useCase = new BootstrapPlatformAdminUseCase(deps.bootstrapRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ nome: 'X', email: 'x@ketris.dev', password: 'senha-longa-123' }),
    ).rejects.toThrow(PlatformAlreadyBootstrappedError)
  })

  it('lança PlatformAdminEmailAlreadyInUseError quando o e-mail já está em uso', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ status: 'email_already_in_use' }))
    const useCase = new BootstrapPlatformAdminUseCase(deps.bootstrapRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ nome: 'X', email: 'ja-existe@ketris.dev', password: 'senha-longa-123' }),
    ).rejects.toThrow(PlatformAdminEmailAlreadyInUseError)
  })
})
