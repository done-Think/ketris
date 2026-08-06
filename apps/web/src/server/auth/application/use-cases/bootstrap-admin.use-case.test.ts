import { describe, expect, it, vi } from 'vitest'

import {
  AdminAlreadyExistsError,
  EmailAlreadyInUseError,
  TenantNotFoundError,
} from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type {
  BootstrapAdminRepository,
  BootstrapAdminResult,
} from '../ports/bootstrap-admin-repository.port'
import type { PasswordHasher } from '../ports/password-hasher.port'
import { BootstrapAdminUseCase } from './bootstrap-admin.use-case'

const createdAdmin: User = {
  id: 'admin-1',
  tenantId: 'tenant-1',
  nome: 'Primeiro Admin',
  email: 'admin@novo-tenant.dev',
  senhaHash: 'hash-novo',
  papel: 'ADMIN',
  ativo: true,
}

function createDeps(bootstrapFirstAdmin?: (...args: unknown[]) => Promise<BootstrapAdminResult>) {
  const bootstrapAdminRepository: BootstrapAdminRepository = {
    bootstrapFirstAdmin:
      bootstrapFirstAdmin ?? vi.fn().mockResolvedValue({ status: 'created', user: createdAdmin }),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { bootstrapAdminRepository, passwordHasher }
}

describe('BootstrapAdminUseCase', () => {
  it('cria o admin quando o repository confirma o claim (tenant sem admin ainda)', async () => {
    const deps = createDeps()
    const useCase = new BootstrapAdminUseCase(deps.bootstrapAdminRepository, deps.passwordHasher)

    const result = await useCase.execute({
      tenantSlug: 'novo-tenant',
      nome: 'Primeiro Admin',
      email: 'admin@novo-tenant.dev',
      password: 'senha-longa-123',
    })

    expect(result.papel).toBe('ADMIN')
    expect(result).not.toHaveProperty('senhaHash')
    expect(deps.bootstrapAdminRepository.bootstrapFirstAdmin).toHaveBeenCalledWith({
      tenantSlug: 'novo-tenant',
      nome: 'Primeiro Admin',
      email: 'admin@novo-tenant.dev',
      senhaHash: 'hash-novo',
    })
  })

  it('lança TenantNotFoundError quando o slug não corresponde a nenhum tenant', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ status: 'tenant_not_found' }))
    const useCase = new BootstrapAdminUseCase(deps.bootstrapAdminRepository, deps.passwordHasher)

    await expect(
      useCase.execute({
        tenantSlug: 'tenant-inexistente',
        nome: 'X',
        email: 'x@ketris.dev',
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(TenantNotFoundError)
  })

  it('lança AdminAlreadyExistsError quando o tenant já tem um admin (janela de bootstrap fechada)', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ status: 'admin_already_exists' }))
    const useCase = new BootstrapAdminUseCase(deps.bootstrapAdminRepository, deps.passwordHasher)

    await expect(
      useCase.execute({
        tenantSlug: 'ketris-demo',
        nome: 'X',
        email: 'x@ketris.dev',
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(AdminAlreadyExistsError)
  })

  it('lança EmailAlreadyInUseError quando o e-mail já está em uso no tenant', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ status: 'email_already_in_use' }))
    const useCase = new BootstrapAdminUseCase(deps.bootstrapAdminRepository, deps.passwordHasher)

    await expect(
      useCase.execute({
        tenantSlug: 'novo-tenant',
        nome: 'X',
        email: 'ja-existe@ketris.dev',
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError)
  })
})
