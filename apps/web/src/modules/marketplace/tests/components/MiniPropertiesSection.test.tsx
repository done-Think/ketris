import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { MiniPropertiesSection } from '../../components/MiniPropertiesSection'
import { marketplaceService } from '../../services/marketplace-service'
import type { PublicPropertySummary } from '../../types/public-property'

vi.mock('../../services/marketplace-service', () => ({
  marketplaceService: { searchProperties: vi.fn() },
}))

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
    Link: React.forwardRef<HTMLAnchorElement, { href: { params: { id: string } } }>(
      function MockLocalizedLink({ href, ...props }, ref) {
        return React.createElement('a', { ...props, href: `/properties/${href.params.id}`, ref })
      },
    ),
  }
})

function summary(id: string): PublicPropertySummary {
  return {
    id,
    title: `Casa ${id}`,
    purpose: 'SALE',
    propertyType: 'HOUSE',
    price: 900000,
    condoFee: null,
    propertyTax: null,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 2,
    area: 140,
    city: 'Curitiba',
    neighborhood: 'Batel',
    latitude: null,
    longitude: null,
    brokerName: 'Corretor',
    brokerAvatarUrl: null,
    coverUrl: null,
    publishedAt: '2026-10-01T00:00:00.000Z',
  }
}

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  )

  return render(<MiniPropertiesSection />, { wrapper })
}

beforeEach(() => vi.resetAllMocks())

it('lista os imóveis publicados recentemente depois dos destaques', async () => {
  vi.mocked(marketplaceService.searchProperties).mockResolvedValue({
    properties: [summary('a'), summary('b')],
    totalCount: 8,
    page: 2,
    pageSize: 6,
  })
  renderSection()

  expect(await screen.findByRole('region', { name: 'Publicados recentemente' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Casa a/ })).toHaveAttribute('href', '/properties/a')
  expect(screen.getAllByRole('link')).toHaveLength(2)
  expect(marketplaceService.searchProperties).toHaveBeenCalledWith({
    sortBy: 'recent',
    page: 2,
    pageSize: 6,
  })
})

it('esconde a seção quando não há imóveis', async () => {
  vi.mocked(marketplaceService.searchProperties).mockResolvedValue({
    properties: [],
    totalCount: 6,
    page: 2,
    pageSize: 6,
  })
  const { container } = renderSection()

  await vi.waitFor(() => expect(marketplaceService.searchProperties).toHaveBeenCalled())
  expect(container).toBeEmptyDOMElement()
})
