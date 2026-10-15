import { describe, expect, it, vi } from 'vitest'

import type { PlatformTenant } from '../../../domain/platform-tenant.entity'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { ListTenantsUseCase } from '../../../application/use-cases/list-tenants.use-case'

const tenants: PlatformTenant[] = [
  {
    id: 't1',
    nome: 'Imobiliária A',
    slug: 'imobiliaria-a',
    accountType: 'AGENCY',
    status: 'ACTIVE',
    canceledAt: null,
    createdAt: new Date(),
  },
  {
    id: 't2',
    nome: 'Corretor B',
    slug: 'corretor-b',
    accountType: 'BROKER',
    status: 'TRIAL',
    canceledAt: null,
    createdAt: new Date(),
  },
]

describe('ListTenantsUseCase', () => {
  it('retorna todos os tenants com tipo de conta e situação', async () => {
    const repository: PlatformTenantRepository = {
      findMany: vi.fn().mockResolvedValue(tenants),
      findById: vi.fn(),
      updateAccount: vi.fn(),
    }
    const useCase = new ListTenantsUseCase(repository)

    await expect(useCase.execute()).resolves.toEqual(tenants)
  })
})
