import { describe, expect, it, vi } from 'vitest'

import { TenantSlugAlreadyInUseError } from '../../domain/errors'
import type { TenantSummary } from '../../domain/tenant-summary.entity'
import type { TenantRepository } from '../ports/tenant-repository.port'
import { CreateTenantUseCase } from './create-tenant.use-case'

const createdTenant: TenantSummary = {
  id: 't1',
  nome: 'Imobiliária Nova',
  slug: 'imobiliaria-nova',
  createdAt: new Date(),
}

function createRepository(findBySlug?: TenantRepository['findBySlug']): TenantRepository {
  return {
    findBySlug: findBySlug ?? vi.fn().mockResolvedValue(null),
    findById: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn().mockResolvedValue(createdTenant),
  }
}

describe('CreateTenantUseCase', () => {
  it('cria um tenant quando o slug ainda não existe', async () => {
    const repository = createRepository()
    const useCase = new CreateTenantUseCase(repository)

    const result = await useCase.execute({ nome: 'Imobiliária Nova', slug: 'imobiliaria-nova' })

    expect(result).toEqual(createdTenant)
    expect(repository.create).toHaveBeenCalledWith({
      nome: 'Imobiliária Nova',
      slug: 'imobiliaria-nova',
    })
  })

  it('lança TenantSlugAlreadyInUseError quando o slug já existe', async () => {
    const repository = createRepository(vi.fn().mockResolvedValue(createdTenant))
    const useCase = new CreateTenantUseCase(repository)

    await expect(useCase.execute({ nome: 'Outra', slug: 'imobiliaria-nova' })).rejects.toThrow(
      TenantSlugAlreadyInUseError,
    )
    expect(repository.create).not.toHaveBeenCalled()
  })
})
