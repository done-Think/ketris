import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { HeroStats } from '../../components/HeroStats'
import { marketplaceService } from '../../services/marketplace-service'

vi.mock('../../services/marketplace-service', () => ({
  marketplaceService: { getStats: vi.fn() },
}))

function renderStats() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  )

  return render(<HeroStats />, { wrapper })
}

beforeEach(() => vi.resetAllMocks())

it('mostra os números reais com plural', async () => {
  vi.mocked(marketplaceService.getStats).mockResolvedValue({
    publishedProperties: 1280,
    publishedBrokers: 1,
    servedCities: 3,
  })
  renderStats()

  expect(await screen.findByText('imóveis publicados')).toBeInTheDocument()
  expect(screen.getByText('1.280')).toBeInTheDocument()
  expect(screen.getByText('corretor parceiro')).toBeInTheDocument()
  expect(screen.getByText('cidades atendidas')).toBeInTheDocument()
})

it('omite os indicadores zerados', async () => {
  vi.mocked(marketplaceService.getStats).mockResolvedValue({
    publishedProperties: 4,
    publishedBrokers: 0,
    servedCities: 1,
  })
  renderStats()

  expect(await screen.findByText('cidade atendida')).toBeInTheDocument()
  expect(screen.queryByText(/corretor/)).not.toBeInTheDocument()
})

it('não renderiza nada sem dados ou quando a busca falha', async () => {
  vi.mocked(marketplaceService.getStats).mockRejectedValue(new Error('offline'))
  const { container } = renderStats()

  await vi.waitFor(() => expect(marketplaceService.getStats).toHaveBeenCalled())
  expect(container).toBeEmptyDOMElement()
})
