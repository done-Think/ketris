import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgenciesPage } from '../../components/AgenciesPage'
import { MiniPropertiesSection } from '../../components/MiniPropertiesSection'
import { useAgencyProfiles } from '../../hooks/use-agency-profile'
import { useMiniProperties } from '../../hooks/use-mini-properties'
import type { PublicAgencyProfile } from '../../types/public-agency-profile'

vi.mock('../../hooks/use-mini-properties', () => ({ useMiniProperties: vi.fn() }))
vi.mock('../../hooks/use-agency-profile', () => ({ useAgencyProfiles: vi.fn() }))
vi.mock('../../components/MarketplaceHeader', () => ({ MarketplaceHeader: () => null }))
vi.mock('@shared/components/layout', () => ({ SiteFooter: () => null }))

function agency(id: string, displayName: string): PublicAgencyProfile {
  return {
    id,
    displayName,
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
    status: 'PUBLISHED',
    publishedAt: null,
    stats: { activeListings: 0, brokersCount: 0, dealsClosed: 0 },
    team: [],
    featuredListings: [],
  }
}

function renderWithTheme(element: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>)
}

beforeEach(() => vi.clearAllMocks())

describe('MiniPropertiesSection', () => {
  it('links each mini card to its property', () => {
    vi.mocked(useMiniProperties).mockReturnValue({
      miniProperties: [
        {
          id: 'p7',
          href: { pathname: '/properties/[id]', params: { id: 'p7' } },
          title: 'Studio no Batel',
          location: 'Batel, Curitiba',
          image: null,
        },
      ],
      isLoading: false,
      isError: false,
    })
    renderWithTheme(<MiniPropertiesSection />)

    expect(screen.getByRole('link', { name: /Studio no Batel/ })).toHaveAttribute(
      'href',
      expect.stringContaining('p7'),
    )
  })

  it('renders nothing while loading, on error or without properties', () => {
    for (const state of [
      { isLoading: true, isError: false },
      { isLoading: false, isError: true },
      { isLoading: false, isError: false },
    ]) {
      vi.mocked(useMiniProperties).mockReturnValue({ miniProperties: [], ...state })
      const { container, unmount } = renderWithTheme(<MiniPropertiesSection />)
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })
})

describe('AgenciesPage', () => {
  it('shows the loaded page out of the server total and searches on the server', async () => {
    vi.mocked(useAgencyProfiles).mockReturnValue({
      data: { pages: [{ agencies: [agency('a1', 'Imobiliária Horizonte')], totalCount: 30 }] },
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useAgencyProfiles>)
    const user = userEvent.setup()
    renderWithTheme(<AgenciesPage />)

    expect(screen.getByText('1 de 30 imobiliárias encontradas')).toBeVisible()
    expect(screen.getAllByText('Imobiliária Horizonte').length).toBeGreaterThan(0)
    expect(useAgencyProfiles).toHaveBeenLastCalledWith('')

    await user.type(screen.getByPlaceholderText('Nome, CRECI, região ou cobertura'), ' centro ')

    await waitFor(() => expect(useAgencyProfiles).toHaveBeenLastCalledWith('centro'))
  })
})
