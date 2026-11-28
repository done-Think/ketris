import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnackbarProvider } from 'notistack'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as navigation from '@/i18n/navigation'

import { FavoritesPage } from '../../components/favorites/FavoritesPage'
import { favoritePropertiesService } from '../../services/favorite-properties-service'
import { availableFavorite, unavailableFavorite } from '../fixtures/favorite-properties'

const mocks = vi.hoisted(() => ({
  status: 'authenticated' as 'authenticated' | 'unauthenticated' | 'loading',
}))

vi.mock('next-auth/react', () => ({ useSession: () => ({ status: mocks.status, data: null }) }))
vi.mock('../../components/MarketplaceHeader', () => ({ MarketplaceHeader: () => null }))
vi.mock('@shared/components/layout', () => ({ SiteFooter: () => null }))
vi.mock('../../hooks/use-marketplace-actor-key', () => ({
  useMarketplaceActorKey: () => 'tenant-1:user-1:RENTER',
}))
vi.mock('../../services/favorite-properties-service', () => ({
  favoritePropertiesService: { list: vi.fn(), save: vi.fn(), remove: vi.fn() },
}))

const service = vi.mocked(favoritePropertiesService)
const favorites = [
  availableFavorite('p1', { title: 'Apartamento Localizado' }),
  availableFavorite('p2', { title: 'Casa com quintal', purpose: 'SALE', price: 890000 }),
  unavailableFavorite('p3'),
]

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <SnackbarProvider domRoot={document.body}>
        <FavoritesPage />
      </SnackbarProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.status = 'authenticated'
  service.list.mockResolvedValue({ limit: 200, favorites })
  service.save.mockResolvedValue({ propertyId: 'p3', savedAt: '2026-11-23T12:00:00.000Z' })
  service.remove.mockResolvedValue(undefined)
})

describe('FavoritesPage', () => {
  it('invites a visitor to sign in without loading favorites', () => {
    mocks.status = 'unauthenticated'
    renderPage()

    expect(screen.getByRole('heading', { name: 'Entre para ver seus favoritos' })).toBeVisible()
    expect(service.list).not.toHaveBeenCalled()
  })

  it('shows where to start when nothing was saved yet', async () => {
    service.list.mockResolvedValue({ limit: 200, favorites: [] })
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Você ainda não salvou nenhum imóvel' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ver imóveis para alugar' })).toBeVisible()
  })

  it('lists saved properties with counts per purpose and the unavailable ones', async () => {
    renderPage()

    expect(await screen.findByText('3 imóveis salvos')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Todos (3)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Alugar (1)' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Comprar (1)' })).toBeVisible()
    expect(screen.getByText('Apartamento Localizado')).toBeVisible()
    expect(screen.getByText('Casa com quintal')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Não estão mais disponíveis' })).toBeVisible()
  })

  it('keeps the purpose filter in the address', async () => {
    const replace = vi.fn()
    vi.spyOn(navigation, 'useRouter').mockReturnValue({ replace } as never)
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Comprar (1)' }))

    expect(replace).toHaveBeenCalledWith(
      { pathname: '/favorites', query: { purpose: 'buy' } },
      { scroll: false },
    )
  })

  it('removes an unavailable property and lets the person undo it', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Remover' }))

    expect(service.remove).toHaveBeenCalledWith('p3')
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }))
    await waitFor(() => expect(service.save).toHaveBeenCalledWith('p3'))
  })

  it('offers to try again when the list cannot be loaded', async () => {
    service.list.mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('Não foi possível carregar seus favoritos.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('3 imóveis salvos')).toBeVisible()
  })
})
