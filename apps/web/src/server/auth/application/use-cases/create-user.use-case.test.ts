import { describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError } from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { UserRepository } from '../ports/user-repository.port'
import { CreateUserUseCase } from './create-user.use-case'

const admin: User = {
  id: 'admin-1',
  tenantId: 'tenant-1',
  nome: 'Admin',
  email: 'admin@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'ADMIN',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

const createdUser: User = {
  id: 'user-2',
  tenantId: 'tenant-1',
  nome: 'Ana Agente',
  email: 'ana@ketris.dev',
  senhaHash: 'hash-novo',
  papel: 'AGENT',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

function createDeps(overrides?: {
  findByEmail?: UserRepository['findByEmail']
  create?: UserRepository['create']
}) {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: overrides?.create ?? vi.fn().mockResolvedValue(createdUser),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { userRepository, passwordHasher }
}

describe('CreateUserUseCase', () => {
  it('cria o usuário quando o ator é ADMIN e o e-mail não existe no tenant', async () => {
    const deps = createDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.passwordHasher)

    const result = await useCase.execute({
      actorTenantId: admin.tenantId,
      actorPapel: admin.papel,
      nome: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      papel: 'AGENT',
    })

    expect(result).toEqual({
      id: createdUser.id,
      tenantId: createdUser.tenantId,
      nome: createdUser.nome,
      email: createdUser.email,
      papel: createdUser.papel,
      ativo: createdUser.ativo,
      vinculoAprovadoEm: createdUser.vinculoAprovadoEm,
    })
    expect(result).not.toHaveProperty('senhaHash')
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('senha-longa-123')
    expect(deps.userRepository.create).toHaveBeenCalledWith({
      tenantId: admin.tenantId,
      nome: 'Ana Agente',
      email: 'ana@ketris.dev',
      senhaHash: 'hash-novo',
      papel: 'AGENT',
    })
  })

  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({
        actorTenantId: admin.tenantId,
        actorPapel: 'AGENT',
        nome: 'Ana Agente',
        email: 'ana@ketris.dev',
        password: 'senha-longa-123',
        papel: 'AGENT',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('lança EmailAlreadyInUseError quando já existe usuário com o e-mail em qualquer tenant', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(admin) })
    const useCase = new CreateUserUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({
        actorTenantId: admin.tenantId,
        actorPapel: 'ADMIN',
        nome: 'Ana Agente',
        email: admin.email,
        password: 'senha-longa-123',
        papel: 'AGENT',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('checa duplicidade globalmente (e-mail é único no sistema todo, não só por tenant)', async () => {
    const deps = createDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.passwordHasher)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      nome: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      papel: 'AGENT',
    })

    expect(deps.userRepository.findByEmail).toHaveBeenCalledWith('ana@ketris.dev')
  })
})
