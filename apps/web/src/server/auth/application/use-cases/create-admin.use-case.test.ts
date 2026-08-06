import { describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError } from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { UserRepository } from '../ports/user-repository.port'
import { CreateAdminUseCase } from './create-admin.use-case'

const admin: User = {
  id: 'admin-1',
  tenantId: 'tenant-1',
  nome: 'Admin',
  email: 'admin@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'ADMIN',
  ativo: true,
}

const createdAdmin: User = {
  id: 'admin-2',
  tenantId: 'tenant-1',
  nome: 'Novo Admin',
  email: 'admin2@ketris.dev',
  senhaHash: 'hash-novo',
  papel: 'ADMIN',
  ativo: true,
}

function createDeps(overrides?: {
  findByEmailAndTenant?: UserRepository['findByEmailAndTenant']
  create?: UserRepository['create']
}) {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailAndTenant: overrides?.findByEmailAndTenant ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: overrides?.create ?? vi.fn().mockResolvedValue(createdAdmin),
    update: vi.fn(),
    deactivate: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { userRepository, passwordHasher }
}

describe('CreateAdminUseCase', () => {
  it('cria um administrador quando o ator é ADMIN e o e-mail não existe no tenant', async () => {
    const deps = createDeps()
    const useCase = new CreateAdminUseCase(deps.userRepository, deps.passwordHasher)

    const result = await useCase.execute({
      actorTenantId: admin.tenantId,
      actorPapel: admin.papel,
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.papel).toBe('ADMIN')
    expect(result).not.toHaveProperty('senhaHash')
    expect(deps.userRepository.create).toHaveBeenCalledWith({
      tenantId: admin.tenantId,
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      senhaHash: 'hash-novo',
      papel: 'ADMIN',
    })
  })

  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new CreateAdminUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({
        actorTenantId: admin.tenantId,
        actorPapel: 'AGENT',
        nome: 'Novo Admin',
        email: 'admin2@ketris.dev',
        password: 'senha-longa-123',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('lança EmailAlreadyInUseError quando já existe usuário com o e-mail no tenant', async () => {
    const deps = createDeps({ findByEmailAndTenant: vi.fn().mockResolvedValue(admin) })
    const useCase = new CreateAdminUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({
        actorTenantId: admin.tenantId,
        actorPapel: 'ADMIN',
        nome: 'Novo Admin',
        email: admin.email,
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('sempre cria com papel ADMIN, independentemente de qualquer outro dado de entrada', async () => {
    const deps = createDeps()
    const useCase = new CreateAdminUseCase(deps.userRepository, deps.passwordHasher)

    await useCase.execute({
      actorTenantId: admin.tenantId,
      actorPapel: 'ADMIN',
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
    })

    const call = vi.mocked(deps.userRepository.create).mock.calls[0][0]
    expect(call.papel).toBe('ADMIN')
  })
})
