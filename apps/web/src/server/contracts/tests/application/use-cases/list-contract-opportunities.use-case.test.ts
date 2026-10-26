import { describe, expect, it, vi } from 'vitest'
import { ListContractOpportunitiesUseCase } from '../../../application/use-cases/list-contract-opportunities.use-case'

describe('catálogo de oportunidades de Contracts', () => {
  it('aplica o tenant do gestor e encaminha a busca e paginação', async () => {
    const page = { items: [], totalCount: 0, page: 2, pageSize: 25 }
    const list = vi.fn().mockResolvedValue(page)
    expect(
      await new ListContractOpportunitiesUseCase({ list }).execute({
        actorTenantId: 'agency',
        actorId: 'manager',
        actorPapel: 'OWNER',
        search: 'Apartamento',
        page: 2,
        pageSize: 25,
      }),
    ).toBe(page)
    expect(list).toHaveBeenCalledWith({
      tenantId: 'agency',
      search: 'Apartamento',
      page: 2,
      pageSize: 25,
    })
  })

  it('restringe as oportunidades do corretor aos imóveis sob sua responsabilidade', async () => {
    const list = vi.fn()
    await new ListContractOpportunitiesUseCase({ list }).execute({
      actorTenantId: 'agency',
      actorId: 'agent',
      actorPapel: 'AGENT',
      page: 1,
      pageSize: 25,
    })
    expect(list).toHaveBeenCalledWith({
      tenantId: 'agency',
      responsibleId: 'agent',
      page: 1,
      pageSize: 25,
    })
  })

  it.each(['PROPERTY_OWNER', 'RENTER'] as const)(
    'recusa o perfil %s antes de consultar dados',
    (papel) => {
      const list = vi.fn()
      expect(() =>
        new ListContractOpportunitiesUseCase({ list }).execute({
          actorTenantId: 'agency',
          actorId: 'reader',
          actorPapel: papel,
          page: 1,
          pageSize: 25,
        }),
      ).toThrow()
      expect(list).not.toHaveBeenCalled()
    },
  )
})
