import { describe, expect, it, vi } from 'vitest'

import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { ListOpportunitiesUseCase } from '../../../application/use-cases/list-opportunities.use-case'

describe('ListOpportunitiesUseCase', () => {
  it('delega ao repositório escopado pelo tenant do ator, repassando os filtros', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([])
    const repository = { findManyByTenant } as unknown as OpportunityRepository
    const useCase = new ListOpportunitiesUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      filters: { status: 'ENVIADA', includeArchived: true },
    })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', {
      status: 'ENVIADA',
      includeArchived: true,
    })
  })
})
