import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyPublicProfileEditorPage } from '../../components/AgencyPublicProfileEditorPage'
import { PublicProfileEditorPage } from '../../components/PublicProfileEditorPage'
import { useOwnAgencyProfile } from '../../hooks/use-agency-profile'
import { useOwnBrokerProfile } from '../../hooks/use-broker-profile'
import type { PublicAgencyProfile } from '../../types/public-agency-profile'
import type { PublicBrokerProfile } from '../../types/public-broker-profile'

const draftBrokerProfile: PublicBrokerProfile = {
  id: 'broker-1',
  agencyName: 'Imobiliária Teste',
  email: 'broker@example.com',
  displayName: '',
  headline: null,
  bio: null,
  creci: null,
  phone: null,
  region: null,
  neighborhoods: [],
  specialties: [],
  availability: null,
  primaryColor: null,
  secondaryColor: null,
  backgroundColor: null,
  avatarUrl: null,
  bannerUrl: null,
  status: 'DRAFT',
  publishedAt: null,
  stats: { activeListings: 0, dealsClosed: 0 },
  recentListings: [],
}

const draftAgencyProfile: PublicAgencyProfile = {
  id: 'agency-1',
  displayName: '',
  headline: null,
  summary: null,
  legalCreci: null,
  headquarters: null,
  address: null,
  phone: null,
  email: null,
  coverage: [],
  segments: [],
  yearsInMarket: null,
  primaryColor: null,
  secondaryColor: null,
  backgroundColor: null,
  logoUrl: null,
  bannerUrl: null,
  status: 'DRAFT',
  publishedAt: null,
  stats: { activeListings: 0, brokersCount: 0, dealsClosed: 0 },
  team: [],
  featuredListings: [],
}

vi.mock('@shared/hooks/use-dashboard-face-check-notifications', () => ({
  useDashboardFaceCheckNotifications: () => [],
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))
vi.mock('../../components/public-profile-editor/PublicProfileAddressPanel', () => ({
  PublicProfileAddressPanel: () => null,
}))

const addressMocks = vi.hoisted(() => {
  const handles: Record<'broker' | 'agency', string | null> = { broker: null, agency: null }
  return { handles }
})
vi.mock('../../hooks/use-profile-address', () => ({
  useOwnProfileAddress: (kind: 'broker' | 'agency') => ({
    data: { kind, profileId: `${kind}-1`, handle: addressMocks.handles[kind] },
  }),
}))

const brokerProfileMocks = vi.hoisted(() => ({
  saveMutate: vi.fn(),
  publishMutate: vi.fn(),
  unpublishMutate: vi.fn(),
}))

vi.mock('../../hooks/use-broker-profile', () => ({
  useOwnBrokerProfile: vi.fn(() => ({ data: null })),
  useSaveBrokerProfile: () => ({ mutate: brokerProfileMocks.saveMutate, isPending: false }),
  usePublishBrokerProfile: () => ({ mutate: brokerProfileMocks.publishMutate, isPending: false }),
  useUnpublishBrokerProfile: () => ({
    mutate: brokerProfileMocks.unpublishMutate,
    isPending: false,
  }),
}))

const agencyProfileMocks = vi.hoisted(() => ({
  saveMutate: vi.fn(),
  publishMutate: vi.fn(),
  unpublishMutate: vi.fn(),
}))

vi.mock('../../hooks/use-agency-profile', () => ({
  useOwnAgencyProfile: vi.fn(() => ({ data: null })),
  useSaveAgencyProfile: () => ({ mutate: agencyProfileMocks.saveMutate, isPending: false }),
  usePublishAgencyProfile: () => ({ mutate: agencyProfileMocks.publishMutate, isPending: false }),
  useUnpublishAgencyProfile: () => ({
    mutate: agencyProfileMocks.unpublishMutate,
    isPending: false,
  }),
}))

vi.mock('../../hooks/use-tenant-agents', () => ({
  useTenantAgents: () => ({ data: [] }),
}))

vi.mock('../../hooks/use-profile-media', () => ({
  useUploadProfileMedia: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

function renderWithTheme(component: ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

beforeEach(() => {
  addressMocks.handles.broker = null
  addressMocks.handles.agency = null
})

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('PublicProfileEditorPage', () => {
  it.each([
    { kind: 'broker' as const, Component: PublicProfileEditorPage, handle: 'alyssonsene' },
    { kind: 'agency' as const, Component: AgencyPublicProfileEditorPage, handle: 'horizonte' },
  ])(
    'shows and updates the saved custom link in the $kind published profile preview',
    async ({ kind, Component, handle }) => {
      if (kind === 'broker')
        vi.mocked(useOwnBrokerProfile).mockReturnValue({
          data: { ...draftBrokerProfile, status: 'PUBLISHED' },
        } as ReturnType<typeof useOwnBrokerProfile>)
      else
        vi.mocked(useOwnAgencyProfile).mockReturnValue({
          data: { ...draftAgencyProfile, status: 'PUBLISHED' },
        } as ReturnType<typeof useOwnAgencyProfile>)
      addressMocks.handles[kind] = handle
      const user = userEvent.setup()
      const view = renderWithTheme(<Component />)
      await user.click(screen.getByRole('button', { name: 'Visualizar' }))
      const preview = within(screen.getByRole('dialog'))
      expect(preview.getByText(`/@${handle}`)).toBeVisible()
      expect(preview.getByRole('link', { name: 'Abrir link próprio' })).toHaveAttribute(
        'href',
        `/p/${handle}`,
      )

      addressMocks.handles[kind] = `new-${handle}`
      view.rerender(
        <ThemeProvider theme={theme}>
          <Component />
        </ThemeProvider>,
      )
      expect(preview.queryByText(`/@${handle}`)).not.toBeInTheDocument()
      expect(preview.getByText(`/@new-${handle}`)).toBeVisible()
      expect(preview.getByRole('link', { name: 'Abrir link próprio' })).toHaveAttribute(
        'href',
        `/p/new-${handle}`,
      )
    },
  )

  it.each([PublicProfileEditorPage, AgencyPublicProfileEditorPage])(
    'hides unusable links in an unpublished preview',
    async (Component) => {
      vi.mocked(useOwnBrokerProfile).mockReturnValue({ data: null } as ReturnType<
        typeof useOwnBrokerProfile
      >)
      vi.mocked(useOwnAgencyProfile).mockReturnValue({ data: null } as ReturnType<
        typeof useOwnAgencyProfile
      >)
      const user = userEvent.setup()
      renderWithTheme(<Component />)
      await user.click(screen.getByRole('button', { name: 'Visualizar' }))
      const preview = within(screen.getByRole('dialog'))
      expect(preview.getByText(/Publique o perfil para liberar seu link público/)).toBeVisible()
      expect(preview.queryByRole('link', { name: 'Abrir link próprio' })).not.toBeInTheDocument()
    },
  )

  it('renders the broker editor with validated form controls', () => {
    renderWithTheme(<PublicProfileEditorPage />)

    expect(screen.getByRole('heading', { name: 'Editar Perfil' })).toBeVisible()
    expect(screen.getByLabelText('Nome exibido')).toBeVisible()
    expect(screen.getByLabelText('Cor principal')).toBeVisible()
    expect(screen.getByLabelText('CRECI')).toBeVisible()
    expect(screen.queryByText('Demonstrativo')).not.toBeInTheDocument()
    expect(screen.queryByText('Ordem do perfil')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument()

    const previewButton = screen.getByRole('button', { name: 'Visualizar' })
    const editButton = screen.getByRole('button', { name: 'Editar' })

    expect(previewButton).toBeVisible()
    expect(editButton).toBeVisible()
    expect(previewButton.compareDocumentPosition(editButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders the agency editor with agency-specific controls', () => {
    renderWithTheme(<AgencyPublicProfileEditorPage />)

    expect(screen.getByRole('heading', { name: 'Editar Perfil da Imobiliária' })).toBeVisible()
    expect(screen.getByLabelText('Cor principal')).toBeVisible()
    expect(screen.getByLabelText('Cor secundária')).toBeVisible()
    expect(screen.getByLabelText('Fundo da marca')).toBeVisible()
    expect(screen.getByLabelText('Nome da imobiliária')).toBeVisible()
    expect(screen.getByLabelText('CRECI')).toBeVisible()
    expect(screen.getByLabelText('Corretores em destaque')).toBeVisible()
    expect(screen.queryByText('Demonstrativo')).not.toBeInTheDocument()
    expect(screen.queryByText('Ordem do perfil')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).not.toBeInTheDocument()

    const previewButton = screen.getByRole('button', { name: 'Visualizar' })
    const editButton = screen.getByRole('button', { name: 'Editar' })

    expect(previewButton).toBeVisible()
    expect(editButton).toBeVisible()
    expect(previewButton.compareDocumentPosition(editButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  describe('edit lock toggle', () => {
    it('starts with fields disabled and unlocks them after clicking Editar (broker)', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicProfileEditorPage />)

      expect(screen.getByLabelText('Nome exibido')).toBeDisabled()
      expect(screen.getByLabelText('CRECI')).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Editar' }))

      expect(screen.getByLabelText('Nome exibido')).toBeEnabled()
      expect(screen.getByLabelText('CRECI')).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeVisible()
    })

    it('does not save or re-lock the form when clicking Editar (broker)', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicProfileEditorPage />)

      await user.click(screen.getByRole('button', { name: 'Editar' }))

      expect(brokerProfileMocks.saveMutate).not.toHaveBeenCalled()
      expect(screen.getByLabelText('Nome exibido')).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeVisible()
    })

    it('starts with fields disabled and unlocks them after clicking Editar (agency)', async () => {
      const user = userEvent.setup()
      renderWithTheme(<AgencyPublicProfileEditorPage />)

      expect(screen.getByLabelText('Nome da imobiliária')).toBeDisabled()
      expect(screen.getByLabelText('CRECI')).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Editar' }))

      expect(screen.getByLabelText('Nome da imobiliária')).toBeEnabled()
      expect(screen.getByLabelText('CRECI')).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeVisible()
    })
  })

  describe('publish validation', () => {
    afterEach(() => {
      vi.mocked(useOwnBrokerProfile).mockReturnValue({ data: null } as unknown as ReturnType<
        typeof useOwnBrokerProfile
      >)
      brokerProfileMocks.saveMutate.mockClear()
      brokerProfileMocks.publishMutate.mockClear()
    })

    it('shows the required-field error below the input and does not save or publish when displayName is empty', async () => {
      vi.mocked(useOwnBrokerProfile).mockReturnValue({
        data: draftBrokerProfile,
      } as unknown as ReturnType<typeof useOwnBrokerProfile>)
      const user = userEvent.setup()
      renderWithTheme(<PublicProfileEditorPage />)

      await user.click(screen.getByRole('button', { name: 'Publicar' }))

      expect(await screen.findByText('Informe o nome exibido no perfil')).toBeVisible()
      expect(brokerProfileMocks.saveMutate).not.toHaveBeenCalled()
      expect(brokerProfileMocks.publishMutate).not.toHaveBeenCalled()
    })

    it('shows the required-field errors below every empty field when publishing without them', async () => {
      vi.mocked(useOwnBrokerProfile).mockReturnValue({
        data: { ...draftBrokerProfile, displayName: 'Ana Souza' },
      } as unknown as ReturnType<typeof useOwnBrokerProfile>)
      const user = userEvent.setup()
      renderWithTheme(<PublicProfileEditorPage />)

      await user.click(screen.getByRole('button', { name: 'Publicar' }))

      expect(await screen.findByText('Informe a biografia')).toBeVisible()
      expect(screen.getByText('Informe o telefone')).toBeVisible()
      expect(screen.getByText('Informe o CRECI')).toBeVisible()
      expect(screen.getByText('Informe a disponibilidade')).toBeVisible()
      expect(screen.getByText('Informe o título de destaque')).toBeVisible()
      expect(screen.getByText('Informe a região de atuação')).toBeVisible()
      expect(screen.getByLabelText('Bairros de atuação')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      )
      expect(screen.getByText('Informe as especialidades')).toBeVisible()
      expect(screen.getByText('Informe a cor principal')).toBeVisible()
      expect(screen.getByText('Informe a cor secundária')).toBeVisible()
      expect(screen.getByText('Informe a cor de fundo')).toBeVisible()
      expect(screen.getByText('Envie uma foto de perfil')).toBeVisible()
      expect(screen.getByText('Envie uma imagem de capa')).toBeVisible()
      expect(brokerProfileMocks.saveMutate).not.toHaveBeenCalled()
      expect(brokerProfileMocks.publishMutate).not.toHaveBeenCalled()
    })

    it('publishes a broker covering a broad region without neighborhoods', async () => {
      vi.mocked(useOwnBrokerProfile).mockReturnValue({
        data: {
          ...draftBrokerProfile,
          displayName: 'Ana Souza',
          headline: 'Especialista em imóveis de alto padrão',
          bio: 'Especialista em imóveis residenciais.',
          phone: '11999998888',
          creci: '12345-F',
          region: 'Sul de Minas',
          neighborhoods: [],
          specialties: ['Apartamentos', 'Cobertura'],
          availability: 'Seg a sex, 9h às 18h',
          primaryColor: '#111111',
          secondaryColor: '#222222',
          backgroundColor: '#ffffff',
          avatarUrl: 'https://cdn.ketris.com.br/avatar.jpg',
          bannerUrl: 'https://cdn.ketris.com.br/banner.jpg',
        },
      } as unknown as ReturnType<typeof useOwnBrokerProfile>)
      brokerProfileMocks.saveMutate.mockImplementation((_payload, options) => {
        options?.onSuccess?.()
      })
      const user = userEvent.setup()
      renderWithTheme(<PublicProfileEditorPage />)

      await user.click(screen.getByRole('button', { name: 'Publicar' }))

      await waitFor(() => expect(brokerProfileMocks.saveMutate).toHaveBeenCalledTimes(1))
      expect(brokerProfileMocks.saveMutate.mock.calls[0][0]).toMatchObject({
        displayName: 'Ana Souza',
        region: 'Sul de Minas',
        neighborhoods: [],
      })
      await waitFor(() => expect(brokerProfileMocks.publishMutate).toHaveBeenCalledTimes(1))
    })
  })

  describe('agency publish validation', () => {
    afterEach(() => {
      vi.mocked(useOwnAgencyProfile).mockReturnValue({ data: null } as unknown as ReturnType<
        typeof useOwnAgencyProfile
      >)
      agencyProfileMocks.saveMutate.mockClear()
      agencyProfileMocks.publishMutate.mockClear()
    })

    it('loads account defaults, masks both phone lengths and saves the inherited logo', async () => {
      const logoUrl = '/api/auth/media/avatars/tenant-1/owner-1/company.png'
      vi.mocked(useOwnAgencyProfile).mockReturnValue({
        data: {
          ...draftAgencyProfile,
          displayName: 'Imobiliária Horizonte',
          email: 'verified@example.com',
          legalCreci: 'MG-12345-J',
          phone: '35997989991',
          logoUrl,
        },
      } as unknown as ReturnType<typeof useOwnAgencyProfile>)
      const user = userEvent.setup()
      renderWithTheme(<AgencyPublicProfileEditorPage />)

      expect(screen.getByLabelText('E-mail')).toHaveValue('verified@example.com')
      expect(screen.getByLabelText('CRECI')).toHaveValue('MG-12345-J')
      expect(screen.getByLabelText('Telefone')).toHaveValue('(35) 99798-9991')
      expect(document.querySelector(`img[src="${logoUrl}"]`)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Editar' }))
      const phone = screen.getByLabelText('Telefone')
      await user.clear(phone)
      await user.type(phone, '35999990000')
      expect(phone).toHaveValue('(35) 99999-0000')
      await user.clear(phone)
      await user.type(phone, '3536221234')
      expect(phone).toHaveValue('(35) 3622-1234')
      await user.click(screen.getByRole('button', { name: 'Salvar' }))

      await waitFor(() =>
        expect(agencyProfileMocks.saveMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'verified@example.com',
            legalCreci: 'MG-12345-J',
            phone: '(35) 3622-1234',
            logoUrl,
          }),
          expect.any(Object),
        ),
      )
    })

    it('shows the required-field errors below every empty field when publishing without them', async () => {
      vi.mocked(useOwnAgencyProfile).mockReturnValue({
        data: { ...draftAgencyProfile, displayName: 'Imobiliária Horizonte' },
      } as unknown as ReturnType<typeof useOwnAgencyProfile>)
      const user = userEvent.setup()
      renderWithTheme(<AgencyPublicProfileEditorPage />)

      await user.click(screen.getByRole('button', { name: 'Publicar' }))

      expect(await screen.findByText('Informe a descrição da imobiliária')).toBeVisible()
      expect(screen.getByText('Informe o CRECI da imobiliária')).toBeVisible()
      expect(screen.getByText('Informe o título de destaque')).toBeVisible()
      expect(screen.getByText('Informe a sede')).toBeVisible()
      expect(screen.getByText('Informe o endereço')).toBeVisible()
      expect(screen.getByText('Informe as áreas de cobertura')).toBeVisible()
      expect(screen.getByText('Informe os segmentos de atuação')).toBeVisible()
      expect(screen.getByText('Informe os anos de mercado')).toBeVisible()
      expect(screen.getByText('Informe a cor de fundo')).toBeVisible()
      expect(screen.getByText('Envie o logotipo')).toBeVisible()
      expect(screen.getByText('Envie uma imagem de capa')).toBeVisible()
      expect(screen.getByLabelText('Corretores em destaque')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      )
      expect(agencyProfileMocks.saveMutate).not.toHaveBeenCalled()
      expect(agencyProfileMocks.publishMutate).not.toHaveBeenCalled()
    })

    it('saves the draft and publishes without any featured brokers', async () => {
      vi.mocked(useOwnAgencyProfile).mockReturnValue({
        data: {
          ...draftAgencyProfile,
          displayName: 'Imobiliária Horizonte',
          headline: 'A imobiliária que entende você',
          summary: 'A imobiliária mais completa da cidade.',
          legalCreci: 'SP-654321',
          headquarters: 'São Paulo, SP',
          address: 'Av. Paulista, 1000',
          phone: '(11) 90000-0000',
          coverage: ['Zona Sul', 'Zona Oeste'],
          segments: ['Residencial', 'Comercial'],
          yearsInMarket: 0,
          backgroundColor: '#ffffff',
          logoUrl: 'https://cdn.ketris.com.br/logo.jpg',
          bannerUrl: 'https://cdn.ketris.com.br/banner.jpg',
          team: [],
        },
      } as unknown as ReturnType<typeof useOwnAgencyProfile>)
      agencyProfileMocks.saveMutate.mockImplementation((_payload, options) => {
        options?.onSuccess?.()
      })
      const user = userEvent.setup()
      renderWithTheme(<AgencyPublicProfileEditorPage />)

      await user.click(screen.getByRole('button', { name: 'Publicar' }))

      await waitFor(() => expect(agencyProfileMocks.saveMutate).toHaveBeenCalledTimes(1))
      expect(agencyProfileMocks.saveMutate.mock.calls[0][0]).toMatchObject({
        displayName: 'Imobiliária Horizonte',
        team: [],
        yearsInMarket: 0,
      })
      await waitFor(() => expect(agencyProfileMocks.publishMutate).toHaveBeenCalledTimes(1))
    })
  })
})
