import { describe, expect, it, vi } from 'vitest'

import type { TenantSummary } from '../../domain/tenant-summary.entity'
import type { TenantRepository } from '../ports/tenant-repository.port'
import { ListTenantsUseCase } from './list-tenants.use-case'

const tenants: TenantSummary[] = [
  { id: 't1', nome: 'Imobiliária A', slug: 'imobiliaria-a', createdAt: new Date() },
  { id: 't2', nome: 'Imobiliária B', slug: 'imobiliaria-b', createdAt: new Date() },
]

describe('ListTenantsUseCase', () => {
  it('retorna todos os tenants', async () => {
    const tenantRepository: TenantRepository = {
      findBySlug: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn().mockResolvedValue(tenants),
      create: vi.fn(),
    }
    const useCase = new ListTenantsUseCase(tenantRepository)

    const result = await useCase.execute()

    expect(result).toHaveLength(2)
    expect(result).toEqual(tenants)
  })
})
