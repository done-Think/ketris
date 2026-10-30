import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { HomePage } from '../../components/HomePage'
import { marketplaceService } from '../../services/marketplace-service'
import type { PublicPropertySummary } from '../../types/public-property'

vi.mock('../../services/marketplace-service', () => ({
  marketplaceService: { searchProperties: vi.fn() },
}))
vi.mock('../../hooks/use-marketplace-stats', () => ({
  useMarketplaceStats: () => ({ data: { locations: [] } }),
}))
vi.mock('../../components/MarketplaceHeader', () => ({ MarketplaceHeader: () => null }))
vi.mock('../../components/MarketplaceFooter', () => ({ MarketplaceFooter: () => null }))
vi.mock('../../components/HeroStats', () => ({ HeroStats: () => null }))
vi.mock('../../components/HeroBrandVideo', () => ({ HeroBrandVideo: () => null }))

const summary: PublicPropertySummary = {
  id: 'rent',
  title: 'Casa aluguel',
  purpose: 'RENT',
  propertyType: 'HOUSE',
  price: 2500,
  condoFee: null,
  propertyTax: null,
  bedrooms: 2,
  bathrooms: 1,
  parkingSpots: 1,
  area: 100,
  city: 'Curitiba',
  neighborhood: 'Centro',
  latitude: null,
  longitude: null,
  brokerName: 'Broker',
  brokerAvatarUrl: null,
  coverUrl: null,
  publishedAt: null,
}

it('updates the featured properties on purpose selection and preserves the price used by Search', async () => {
  vi.mocked(marketplaceService.searchProperties).mockImplementation(async (filters = {}) => ({
    properties:
      filters.page === 2
        ? []
        : [
            filters.purpose === 'SALE'
              ? { ...summary, id: 'sale', title: 'Casa venda', purpose: 'SALE', price: 650000 }
              : summary,
          ],
    totalCount: 1,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 6,
  }))
  const user = userEvent.setup()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<HomePage />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  expect(await screen.findByText('Casa aluguel')).toBeVisible()
  expect(screen.queryByText('Casa venda')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Faixa de preço Qualquer preço' }))
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Máximo' }), {
    target: { value: '750000' },
  })
  await user.click(screen.getByRole('button', { name: 'Aplicar' }))
  await user.click(screen.getByRole('button', { name: 'Comprar' }))
  expect(await screen.findByText('Casa venda')).toBeVisible()
  expect(screen.queryByText('Casa aluguel')).not.toBeInTheDocument()
  for (const link of screen.getAllByRole('link', { name: 'Buscar' })) {
    expect(link).toHaveAttribute('href', '/imoveis?purpose=buy&priceRange=-750000')
  }
  await user.click(screen.getByRole('button', { name: 'Alugar' }))
  expect(await screen.findByText('Casa aluguel')).toBeVisible()
  expect(screen.queryByText('Casa venda')).not.toBeInTheDocument()
})
