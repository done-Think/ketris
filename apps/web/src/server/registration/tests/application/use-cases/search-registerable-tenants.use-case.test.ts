import { describe, expect, it, vi } from 'vitest'

import type { TenantRepository } from '@server/platform/application/ports/tenant-repository.port'
import type { TenantSummary } from '@server/platform/domain/tenant-summary.entity'

import { RENTER_TENANT_SLUG } from '../../../application/use-cases/register-renter.use-case'
import { SearchRegisterableTenantsUseCase } from '../../../application/use-cases/search-registerable-tenants.use-case'

const results: TenantSummary[] = [
  { id: 't1', nome: 'Imobiliária A', slug: 'imobiliaria-a', createdAt: new Date() },
]

describe('SearchRegisterableTenantsUseCase', () => {
  it('busca tenants pelo nome, excluindo o tenant compartilhado de locatários', async () => {
    const tenantRepository: TenantRepository = {
      findBySlug: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      searchByName: vi.fn().mockResolvedValue(results),
    }
    const useCase = new SearchRegisterableTenantsUseCase(tenantRepository)

    const result = await useCase.execute({ query: 'Imobiliária' })

    expect(tenantRepository.searchByName).toHaveBeenCalledWith('Imobiliária', [RENTER_TENANT_SLUG])
    expect(result).toEqual(results)
  })
})
