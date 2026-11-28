import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { SnackbarProvider } from 'notistack'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as navigation from '@/i18n/navigation'

import { FavoriteButton } from '../../components/favorites/FavoriteButton'
import { favoritePropertiesService } from '../../services/favorite-properties-service'

const mocks = vi.hoisted(() => ({
  status: 'authenticated' as 'authenticated' | 'unauthenticated' | 'loading',
}))

vi.mock('next-auth/react', () => ({ useSession: () => ({ status: mocks.status, data: null }) }))
vi.mock('../../hooks/use-marketplace-actor-key', () => ({
  useMarketplaceActorKey: () => 'tenant-1:user-1:RENTER',
}))
vi.mock('../../services/favorite-properties-service', () => ({
  favoritePropertiesService: { list: vi.fn(), save: vi.fn(), remove: vi.fn() },
}))

const service = vi.mocked(favoritePropertiesService)
const savedAt = '2026-11-23T12:00:00.000Z'

function mockSavedIds(ids: string[]) {
  service.list.mockResolvedValue({
    limit: 200,
    favorites: ids.map((propertyId) => ({
      propertyId,
      savedAt,
      available: false,
      property: { title: 'Apartamento', city: null, neighborhood: null },
    })),
  })
}

function renderButton() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <SnackbarProvider domRoot={document.body}>
        <FavoriteButton propertyId="p1" />
      </SnackbarProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.status = 'authenticated'
  mockSavedIds([])
  service.save.mockResolvedValue({ propertyId: 'p1', savedAt })
  service.remove.mockResolvedValue(undefined)
})

describe('FavoriteButton', () => {
  it('saves the property and shows it as saved', async () => {
    const user = userEvent.setup()
    renderButton()
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(1))
    mockSavedIds(['p1'])

    await user.click(screen.getByRole('button', { name: 'Favoritar' }))

    expect(service.save).toHaveBeenCalledWith('p1')
    expect(await screen.findByRole('button', { name: 'Favoritado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('removes a saved property', async () => {
    mockSavedIds(['p1'])
    const user = userEvent.setup()
    renderButton()

    await user.click(await screen.findByRole('button', { name: 'Favoritado' }))

    expect(service.remove).toHaveBeenCalledWith('p1')
  })

  it('goes back to the previous state and explains when the limit is reached', async () => {
    service.save.mockRejectedValue(
      new AxiosError('limit', '422', undefined, undefined, {
        status: 422,
        data: { error: { code: 'FAVORITE_LIMIT_REACHED' } },
      } as AxiosResponse),
    )
    const user = userEvent.setup()
    renderButton()
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: 'Favoritar' }))

    expect(
      await screen.findByText(
        'Você já salvou 200 imóveis. Remova algum favorito para salvar outro.',
      ),
    ).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Favoritar' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('sends a visitor to sign in and come back to the property', async () => {
    mocks.status = 'unauthenticated'
    const push = vi.fn()
    vi.spyOn(navigation, 'useRouter').mockReturnValue({ push } as never)
    window.history.replaceState(null, '', '/pt/imoveis/p1?purpose=rent')
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole('button', { name: 'Favoritar' }))

    expect(service.save).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({
      pathname: '/login',
      query: { callbackUrl: '/pt/imoveis/p1?purpose=rent' },
    })
  })
})
