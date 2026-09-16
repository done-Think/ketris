import { describe, expect, it, vi } from 'vitest'

import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { ListOpportunitiesUseCase } from '../../../application/use-cases/list-opportunities.use-case'

describe('ListOpportunitiesUseCase', () => {
  it('delega ao repositório escopado pelo tenant do ator, repassando os filtros (ADMIN sem restrição)', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([])
    const repository = { findManyByTenant } as unknown as OpportunityRepository
    const useCase = new ListOpportunitiesUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
      filters: { status: 'ENVIADA', includeArchived: true },
    })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', {
      status: 'ENVIADA',
      includeArchived: true,
    })
  })

  it('OWNER também não sofre restrição', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([])
    const repository = { findManyByTenant } as unknown as OpportunityRepository
    const useCase = new ListOpportunitiesUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorId: 'user-1', actorPapel: 'OWNER' })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', {})
  })

  it('AGENT tem a listagem escopada pelo próprio id, via responsavelId', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([])
    const repository = { findManyByTenant } as unknown as OpportunityRepository
    const useCase = new ListOpportunitiesUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      filters: { status: 'ENVIADA' },
    })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', {
      status: 'ENVIADA',
      responsavelId: 'agent-1',
    })
  })
})
