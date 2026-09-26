import { describe, expect, it, vi } from 'vitest'

import type { LeadRepository } from '../../../application/ports/lead-repository.port'
import { ListLeadsUseCase } from '../../../application/use-cases/list-leads.use-case'

describe('ListLeadsUseCase', () => {
  it('não restringe por responsavelId quando o ator é ADMIN', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([])
    const repository = { findManyByTenant } as unknown as LeadRepository
    const useCase = new ListLeadsUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorId: 'admin-1', actorPapel: 'ADMIN' })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', { responsavelId: undefined })
  })

  it('restringe por responsavelId quando o ator é AGENT', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([])
    const repository = { findManyByTenant } as unknown as LeadRepository
    const useCase = new ListLeadsUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorId: 'agent-1', actorPapel: 'AGENT' })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', { responsavelId: 'agent-1' })
  })
})
