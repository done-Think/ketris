import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAgencyProfiles } from '../../hooks/use-agency-profile'
import { useFeaturedProperties } from '../../hooks/use-featured-properties'
import { useLoadMoreOnScroll } from '../../hooks/use-directory-list'
import { useMiniProperties } from '../../hooks/use-mini-properties'
import { agencyProfileService } from '../../services/agency-profile-service'
import { marketplaceService } from '../../services/marketplace-service'
import type { PublicPropertySummary } from '../../types/public-property'
import { nextDirectoryPage } from '../../utils/directory'

vi.mock('next-intl', () => ({
  useLocale: () => 'pt-BR',
  useTranslations: () => (key: string) => key,
}))
vi.mock('../../services/marketplace-service', () => ({
  marketplaceService: { searchProperties: vi.fn() },
}))
vi.mock('../../services/agency-profile-service', () => ({
  agencyProfileService: { list: vi.fn() },
}))

function summary(id: string): PublicPropertySummary {
  return {
    id,
    title: `Imóvel ${id}`,
    purpose: 'VENDA',
    propertyType: 'CASA',
    price: 900000,
    condoFee: null,
    propertyTax: null,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 1,
    area: 120,
    city: 'São Paulo',
    neighborhood: 'Moema',
    latitude: null,
    longitude: null,
    brokerName: null,
    brokerAvatarUrl: null,
    coverUrl: null,
    publishedAt: null,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => vi.clearAllMocks())

describe('home property sections', () => {
  it('shows the newest properties as featured and the next six as mini cards', async () => {
    vi.mocked(marketplaceService.searchProperties).mockImplementation(async (filters = {}) => ({
      properties: [summary(`page-${filters.page ?? 1}`)],
      totalCount: 12,
      page: filters.page ?? 1,
      pageSize: 6,
    }))

    const featured = renderHook(() => useFeaturedProperties(), { wrapper })
    const mini = renderHook(() => useMiniProperties(), { wrapper })

    await waitFor(() => expect(mini.result.current.miniProperties).toHaveLength(1))
    await waitFor(() => expect(featured.result.current.featuredProperties).toHaveLength(1))
    expect(marketplaceService.searchProperties).toHaveBeenCalledWith({
      sortBy: 'recent',
      pageSize: 6,
    })
    expect(marketplaceService.searchProperties).toHaveBeenCalledWith({
      sortBy: 'recent',
      page: 2,
      pageSize: 6,
    })
    expect(mini.result.current.miniProperties[0]).toEqual({
      id: 'page-2',
      href: { pathname: '/properties/[id]', params: { id: 'page-2' } },
      title: 'Imóvel page-2',
      location: 'Moema, São Paulo',
      image: null,
    })
  })
})

describe('profile directory', () => {
  it('asks for the next page only while the server still has profiles', () => {
    expect(nextDirectoryPage({ page: 1, pageSize: 12, totalCount: 13 })).toBe(2)
    expect(nextDirectoryPage({ page: 2, pageSize: 12, totalCount: 24 })).toBeUndefined()
  })

  it('loads agencies page by page with the search sent to the server', async () => {
    vi.mocked(agencyProfileService.list).mockImplementation(async ({ page }) => ({
      agencies: [{ id: `agency-${page}` }] as never,
      totalCount: 2,
      page,
      pageSize: 1,
    }))
    const { result } = renderHook(() => useAgencyProfiles('centro'), { wrapper })

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    await act(() => result.current.fetchNextPage())

    await waitFor(() =>
      expect(result.current.data?.pages.flatMap((page) => page.agencies.map((a) => a.id))).toEqual([
        'agency-1',
        'agency-2',
      ]),
    )
    expect(result.current.hasNextPage).toBe(false)
    expect(agencyProfileService.list).toHaveBeenLastCalledWith({
      q: 'centro',
      page: 2,
      pageSize: 12,
    })
  })
})

describe('useLoadMoreOnScroll', () => {
  const observers: { callback: IntersectionObserverCallback; disconnect: () => void }[] = []

  beforeEach(() => {
    observers.length = 0
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect = vi.fn()
        constructor(callback: IntersectionObserverCallback) {
          observers.push({ callback, disconnect: this.disconnect })
        }
        observe() {}
      },
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  function Probe({ enabled, onLoadMore }: { enabled: boolean; onLoadMore: () => void }) {
    const ref = useLoadMoreOnScroll({ enabled, onLoadMore })
    return <div ref={ref} data-testid="sentinel" />
  }

  it('loads more when the sentinel gets close, and stops observing when disabled', () => {
    const onLoadMore = vi.fn()
    const { rerender } = render(<Probe enabled onLoadMore={onLoadMore} />)
    expect(screen.getByTestId('sentinel')).toBeInTheDocument()

    act(() =>
      observers[0].callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    rerender(<Probe enabled={false} onLoadMore={onLoadMore} />)
    expect(observers[0].disconnect).toHaveBeenCalled()
    expect(observers).toHaveLength(1)
  })
})
