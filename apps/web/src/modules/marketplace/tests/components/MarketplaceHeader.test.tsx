import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { LogoutToMarketplaceContext } from '@shared/lib/auth/logout-to-marketplace-context'

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))
vi.mock('@shared/hooks/use-dashboard-face-check-notifications', () => ({
  useDashboardFaceCheckNotifications: () => [],
}))

import { MarketplaceHeader } from '../../components/MarketplaceHeader'

const routerMock = {
  replace: vi.fn(),
  refresh: vi.fn(),
}

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@shared/lib/auth/clear-client-session', () => ({
  clearClientSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => routerMock,
}))

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
    usePathname: () => '/',
    useRouter: () => routerMock,
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})

function renderMarketplaceHeader() {
  render(
    <ThemeProvider theme={theme}>
      <MarketplaceHeader activeItemId="brokers" />
    </ThemeProvider>,
  )
}

describe('MarketplaceHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the actionable shared bell for an authenticated tenant renter', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'renter', name: 'Renter' },
        scope: 'tenant',
        tenantId: 'tenant',
        role: 'RENTER',
        expires: '2099-01-01T00:00:00Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    })
    renderMarketplaceHeader()
    expect(screen.getByRole('button', { name: 'Abrir notificações' })).toBeVisible()
  })

  it('does not expose the tenant notification bell for a platform session', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'admin', name: 'Admin' },
        scope: 'platform',
        expires: '2099-01-01T00:00:00Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    })
    renderMarketplaceHeader()
    expect(screen.queryByRole('button', { name: 'Abrir notificações' })).not.toBeInTheDocument()
  })

  it('delegates logout to the enclosing dashboard when the header is inside a profile preview', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Maria Silva', email: 'maria@example.com' },
        expires: '2099-01-01T00:00:00Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    })
    const logout = vi.fn().mockResolvedValue(undefined)
    render(
      <ThemeProvider theme={theme}>
        <LogoutToMarketplaceContext.Provider value={logout}>
          <MarketplaceHeader activeItemId="brokers" />
        </LogoutToMarketplaceContext.Provider>
      </ThemeProvider>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))
    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(logout).toHaveBeenCalledOnce()
    expect(clearClientSession).not.toHaveBeenCalled()
    expect(routerMock.replace).not.toHaveBeenCalled()
    expect(routerMock.refresh).not.toHaveBeenCalled()
  })

  it('sem sessão: não mostra menu de perfil e deixa o Entrar como último item', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    expect(screen.queryByRole('button', { name: 'Abrir perfil' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Abrir notificações')).not.toBeInTheDocument()
    expect(screen.getAllByText('BR')[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Anunciar Imóvel' })[0]).toHaveAttribute(
      'href',
      '/login',
    )

    const signIn = screen.getByRole('link', { name: 'Entrar' })
    expect(signIn).toHaveAttribute('href', '/login')
    expect(
      screen.getAllByText('BR')[0].compareDocumentPosition(signIn) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('enquanto a sessão carrega: não mostra nem o avatar nem o seletor de idioma (evita flash)', () => {
    vi.mocked(useSession).mockReturnValue({
      data: undefined,
      status: 'loading',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    expect(screen.queryByRole('button', { name: 'Abrir perfil' })).not.toBeInTheDocument()
    expect(screen.queryByText('BR')).not.toBeInTheDocument()
  })

  it('com sessão: mostra o avatar com dados reais e abre o dropdown com nome/e-mail da sessão', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'candidate', name: 'Maria Silva', email: 'maria@example.com' },
        scope: 'tenant',
        tenantId: 'tenant',
        role: 'AGENT',
      },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Abrir notificações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir perfil' })).toHaveTextContent('MS')
    expect(screen.getAllByRole('link', { name: 'Anunciar Imóvel' })[0]).toHaveAttribute(
      'href',
      '/dashboard/properties',
    )

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('maria@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /suporte/i })).toHaveAttribute(
      'href',
      '/dashboard/maintenance',
    )
    expect(screen.getByRole('link', { name: /configurações/i })).toHaveAttribute(
      'href',
      '/dashboard/public-profile',
    )
  })

  it('RENTER: não mostra o botão de anunciar imóvel e oferece tornar corretor', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Maria Locatária', email: 'maria@example.com' }, role: 'RENTER' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    expect(screen.queryByRole('link', { name: 'Anunciar Imóvel' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))

    expect(screen.getByRole('link', { name: 'Tornar corretor' })).toHaveAttribute(
      'href',
      '/register/details?profile=broker',
    )
  })

  it('AGENT: oferece criar imobiliária no menu de perfil', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Carlos Corretor', email: 'carlos@example.com' }, role: 'AGENT' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))

    expect(screen.getByRole('link', { name: 'Criar imobiliária' })).toHaveAttribute(
      'href',
      '/register/details?profile=agency',
    )
  })

  it('OWNER: nÃ£o mostra a aÃ§Ã£o de troca de modalidade no menu de perfil', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ana Admin', email: 'ana@example.com' }, role: 'OWNER' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))

    expect(screen.queryByRole('link', { name: 'Cadastrar novo corretor' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Trocar modalidade' })).not.toBeInTheDocument()
  })

  it('com sessão: clicar em "Sair" chama signOut()', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Maria Silva', email: 'maria@example.com' } },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))
    await user.click(screen.getByRole('button', { name: /sair/i }))

    expect(clearClientSession).toHaveBeenCalledOnce()
    expect(routerMock.replace).toHaveBeenCalledWith('/')
    expect(routerMock.refresh).toHaveBeenCalledOnce()
  })
})
