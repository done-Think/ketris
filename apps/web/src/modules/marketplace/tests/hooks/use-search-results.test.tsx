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

function mockPages(totalCount = 23) {
  vi.mocked(marketplaceService.searchProperties).mockImplementation(async (filters = {}) => ({
    properties: [summary(`p${filters.page}`)],
    totalCount,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 10,
  }))
}

it('envia os filtros iniciais da URL usando o código do tipo de imóvel', async () => {
  mockPages()
  const { result } = renderHook(
    () =>
      useSearchResults({
        purpose: 'comprar',
        initialLocation: 'Moema',
        initialPropertyType: 'CASA',
        initialPriceRange: { min: 2000, max: 8000 },
      }),
    { wrapper },
  )

  await waitFor(() => expect(result.current.resultCount).toBe(23))
  expect(marketplaceService.searchProperties).toHaveBeenCalledWith(
    expect.objectContaining({
      purpose: 'VENDA',
      location: 'Moema',
      propertyType: 'CASA',
      minPrice: 2000,
      maxPrice: 8000,
    }),
  )
  expect(result.current.activeFiltersCount).toBe(2)
})

it('aplica os filtros do diálogo de uma vez, volta à primeira página e descarta o preço mínimo da URL', async () => {
  mockPages()
  const { result } = renderHook(
    () => useSearchResults({ purpose: 'alugar', initialPriceRange: { min: 2000, max: 8000 } }),
    { wrapper },
  )
  await waitFor(() => expect(result.current.resultCount).toBe(23))
  act(() => result.current.setCurrentPage(2))
  await waitFor(() => expect(result.current.currentPage).toBe(2))

  act(() =>
    result.current.applyFilters({
      ...result.current.filters,
      customMaxPrice: '5000',
      customMinArea: '80',
      onlyWithParking: true,
    }),
  )

  await waitFor(() =>
    expect(marketplaceService.searchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, maxPrice: 5000, minArea: 80, hasParking: true }),
    ),
  )
  expect(vi.mocked(marketplaceService.searchProperties).mock.lastCall?.[0]).not.toHaveProperty(
    'minPrice',
    2000,
  )
  expect(result.current.activeFiltersCount).toBe(3)
})

it('ordena e busca por local sempre a partir da primeira página', async () => {
  mockPages()
  const { result } = renderHook(() => useSearchResults({ purpose: 'alugar' }), { wrapper })
  await waitFor(() => expect(result.current.resultCount).toBe(23))
  act(() => result.current.setCurrentPage(3))

  act(() => result.current.setSortOption('menor-preco'))
  await waitFor(() =>
    expect(marketplaceService.searchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, sortBy: 'priceAsc' }),
    ),
  )

  act(() => result.current.setLocationQuery(' Centro '))
  await waitFor(() =>
    expect(marketplaceService.searchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, location: 'Centro' }),
    ),
  )
})

it('seleciona o primeiro resultado até o usuário escolher outro', async () => {
  mockPages()
  const { result } = renderHook(() => useSearchResults({ purpose: 'alugar' }), { wrapper })

  await waitFor(() => expect(result.current.selectedPropertyId).toBe('p1'))
  act(() => result.current.setSelectedPropertyId('desconhecido'))
  expect(result.current.selectedPropertyId).toBe('p1')
})
