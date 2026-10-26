import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useSearchResults } from '../../hooks/use-search-results'
import { marketplaceService } from '../../services/marketplace-service'
import type { PublicPropertySummary } from '../../types/public-property'

vi.mock('next-intl', () => ({
  useLocale: () => 'pt-BR',
  useTranslations: () => (key: string) => key,
}))
vi.mock('../../services/marketplace-service', () => ({
  marketplaceService: { searchProperties: vi.fn() },
}))

function summary(id: string): PublicPropertySummary {
  return {
    id,
    title: `Imóvel ${id}`,
    purpose: 'ALUGUEL',
    propertyType: 'APARTAMENTO',
    price: 2500,
    condoFee: null,
    propertyTax: null,
    bedrooms: 2,
    bathrooms: 1,
    parkingSpots: 1,
    area: 60,
    city: 'Curitiba',
    neighborhood: 'Centro',
    latitude: null,
    longitude: null,
    brokerName: 'Corretor',
    brokerAvatarUrl: null,
    coverUrl: null,
    publishedAt: '2026-10-01T00:00:00.000Z',
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => vi.resetAllMocks())

it('pede ao servidor só a página atual e calcula as páginas pelo total', async () => {
  vi.mocked(marketplaceService.searchProperties).mockImplementation(async (filters = {}) => ({
    properties: [summary(`p${filters.page}`)],
    totalCount: 23,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 10,
  }))
  const { result } = renderHook(() => useSearchResults({ purpose: 'alugar' }), { wrapper })

  await waitFor(() => expect(result.current.paginatedResults.map((p) => p.id)).toEqual(['p1']))
  expect(result.current.resultCount).toBe(23)
  expect(result.current.totalPages).toBe(3)
  expect(marketplaceService.searchProperties).toHaveBeenCalledWith(
    expect.objectContaining({ page: 1, pageSize: 10, purpose: 'ALUGUEL' }),
  )

  act(() => result.current.setCurrentPage(2))

  await waitFor(() => expect(result.current.paginatedResults.map((p) => p.id)).toEqual(['p2']))
  expect(marketplaceService.searchProperties).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 2, pageSize: 10 }),
  )
})
