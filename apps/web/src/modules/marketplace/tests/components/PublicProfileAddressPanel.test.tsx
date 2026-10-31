import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@shared/theme/theme'
import { PublicProfileAddressPanel } from '../../components/public-profile-editor/PublicProfileAddressPanel'
import { profileAddressService } from '../../services/profile-address-service'

vi.mock('../../hooks/use-marketplace-actor-key', () => ({
  useMarketplaceActorKey: () => 'tenant:user:AGENT',
}))
vi.mock('../../services/profile-address-service', () => ({
  profileAddressService: { getOwn: vi.fn(), save: vi.fn(), availability: vi.fn() },
}))
const copy = vi.fn()
function setup(published = true) {
  const submit = vi.fn((event) => event.preventDefault())
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const tree = (isPublished: boolean) => (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <form onSubmit={submit}>
          <PublicProfileAddressPanel kind="broker" published={isPublished} />
        </form>
      </ThemeProvider>
    </QueryClientProvider>
  )
  const view = render(tree(published))
  return {
    submit,
    user: userEvent.setup(),
    setPublished: (value: boolean) => view.rerender(tree(value)),
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(profileAddressService.getOwn).mockResolvedValue({
    kind: 'broker',
    profileId: 'broker-1',
    handle: 'current-name',
  })
  vi.mocked(profileAddressService.availability).mockResolvedValue({ available: true })
  vi.mocked(profileAddressService.save).mockImplementation(async (_kind, handle) => ({
    kind: 'broker',
    profileId: 'broker-1',
    handle,
  }))
})
describe('profile address editor', () => {
  it('closes address editing on unpublish and restores the saved link after republishing', async () => {
    const { user, setPublished } = setup()
    await user.click(await screen.findByRole('button', { name: 'Personalizar endereço' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    setPublished(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copiar link' })).not.toBeInTheDocument()
    setPublished(true)
    expect(await screen.findByRole('link', { name: '/@current-name' })).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(profileAddressService.save).not.toHaveBeenCalled()
  })
  it('requires publication before fetching, copying or editing a public address', () => {
    setup(false)
    expect(screen.getByText(/Publique o perfil para liberar seu link público/)).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Personalizar endereço' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copiar link' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(profileAddressService.getOwn).not.toHaveBeenCalled()
  })
  it('saves independently without submitting the surrounding profile form', async () => {
    const { user, submit } = setup()
    await user.click(await screen.findByRole('button', { name: 'Personalizar endereço' }))
    const field = screen.getByRole('textbox', { name: 'Nome do endereço' })
    await user.clear(field)
    await user.type(field, 'Nova-Url')
    await user.tab()
    await screen.findByText('Endereço disponível.')
    await user.click(screen.getByRole('button', { name: 'Salvar endereço' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(profileAddressService.save).toHaveBeenCalledWith('broker', 'nova-url')
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: '/@nova-url' })).toHaveAttribute('href', '/@nova-url')
  })
  it('checks on blur and blocks an occupied name', async () => {
    vi.mocked(profileAddressService.availability).mockResolvedValue({ available: false })
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Personalizar endereço' }))
    const field = screen.getByRole('textbox', { name: 'Nome do endereço' })
    await user.clear(field)
    await user.type(field, 'taken-name')
    expect(profileAddressService.availability).not.toHaveBeenCalled()
    await user.tab()
    await screen.findByText('Este endereço já está em uso. Escolha outro nome.')
    expect(screen.getByRole('button', { name: 'Salvar endereço' })).toBeDisabled()
  })
  it('blocks malformed and reserved names before contacting the API', async () => {
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Personalizar endereço' }))
    const field = screen.getByRole('textbox', { name: 'Nome do endereço' })
    for (const handle of ['a--b', 'admin']) {
      await user.clear(field)
      await user.type(field, handle)
      fireEvent.blur(field)
      expect(screen.getByRole('button', { name: 'Salvar endereço' })).toBeDisabled()
    }
    expect(profileAddressService.availability).not.toHaveBeenCalled()
    expect(profileAddressService.save).not.toHaveBeenCalled()
  })
  it('handles a save conflict even after a successful availability check', async () => {
    vi.mocked(profileAddressService.save).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code: 'PUBLIC_PROFILE_ADDRESS_TAKEN' } } },
    })
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Personalizar endereço' }))
    const field = screen.getByRole('textbox', { name: 'Nome do endereço' })
    await user.clear(field)
    await user.type(field, 'race-name')
    await user.tab()
    await screen.findByText('Endereço disponível.')
    await user.click(screen.getByRole('button', { name: 'Salvar endereço' }))
    await screen.findByText('Este endereço já está em uso. Escolha outro nome.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '/@current-name', hidden: true })).toHaveAttribute(
      'href',
      '/@current-name',
    )
  })
  it('copies an absolute URL using the current environment origin', async () => {
    const { user } = setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: copy.mockResolvedValue(undefined) },
    })
    await user.click(await screen.findByRole('button', { name: 'Copiar link' }))
    expect(copy).toHaveBeenCalledWith(`${window.location.origin}/@current-name`)
  })
})
