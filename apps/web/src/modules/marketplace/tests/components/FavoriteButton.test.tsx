import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { SnackbarProvider } from 'notistack'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as navigation from '@/i18n/navigation'

import { FavoriteButton } from '../../components/favorites/FavoriteButton'
import { favoritePropertiesService } from '../../services/favorite-properties-service'
import type { FavoriteButtonVariant } from '../../types/favorite-property'

const mocks = vi.hoisted(() => ({
  status: 'authenticated' as 'authenticated' | 'unauthenticated' | 'loading',
  searchParams: new URLSearchParams(),
}))

vi.mock('next-auth/react', () => ({ useSession: () => ({ status: mocks.status, data: null }) }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useSearchParams: () => mocks.searchParams,
}))
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

function renderButton(variant: FavoriteButtonVariant = 'detail') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <SnackbarProvider domRoot={document.body}>
        <FavoriteButton propertyId="p1" variant={variant} />
      </SnackbarProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.status = 'authenticated'
  mocks.searchParams = new URLSearchParams()
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

  it('removes a saved property from the card heart', async () => {
    mockSavedIds(['p1'])
    const user = userEvent.setup()
    renderButton('card')

    await user.click(await screen.findByRole('button', { name: 'Remover dos favoritos' }))

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

  it('invites a visitor to sign in and come back to save the property', async () => {
    mocks.status = 'unauthenticated'
    const user = userEvent.setup()
    const push = vi.fn()
    vi.spyOn(navigation, 'useRouter').mockReturnValue({ push } as never)
    renderButton('card')

    await user.click(screen.getByRole('button', { name: 'Salvar nos favoritos' }))

    expect(service.save).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Entre para salvar este imóvel' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(push).toHaveBeenCalledWith({
      pathname: '/login',
      query: { callbackUrl: expect.stringContaining('saveFavorite=p1') },
    })

    await user.click(screen.getByRole('button', { name: 'Agora não' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('saves the property once when the person comes back from login', async () => {
    mocks.searchParams = new URLSearchParams('saveFavorite=p1')
    window.history.replaceState(null, '', '/pt/imoveis/p1?purpose=rent&saveFavorite=p1')
    renderButton()

    await waitFor(() => expect(service.save).toHaveBeenCalledTimes(1))
    expect(window.location.search).toBe('?purpose=rent')
  })

  it('saves the property from the card heart when the person comes back from login', async () => {
    mocks.searchParams = new URLSearchParams('saveFavorite=p1')
    window.history.replaceState(null, '', '/pt/imoveis?purpose=buy&saveFavorite=p1')
    renderButton('card')

    await waitFor(() => expect(service.save).toHaveBeenCalledTimes(1))
    expect(window.location.search).toBe('?purpose=buy')
  })

  it('does not save a card for another property on the login return', async () => {
    mocks.searchParams = new URLSearchParams('saveFavorite=p2')
    renderButton('card')

    await screen.findByRole('button', { name: 'Salvar nos favoritos' })
    expect(service.save).not.toHaveBeenCalled()
  })
})
