import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'

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

// LanguageSelector usa next/navigation direto (não o wrapper @/i18n/navigation, já mockado
// globalmente em src/test/setup.ts) — sem isso, usePathname() retorna null em jsdom e quebra.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => routerMock,
}))

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

  it('sem sessão: mostra o menu de visitante com acesso aos fluxos existentes', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    expect(screen.getByRole('button', { name: 'Abrir perfil' })).toBeInTheDocument()
    expect(screen.queryByText('V')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('notificações')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(screen.getAllByText('BR')[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Anunciar Imóvel' })[0]).toHaveAttribute(
      'href',
      '/login',
    )

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))

    expect(screen.getAllByRole('link', { name: 'Entrar' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Suporte' })).toHaveAttribute(
      'href',
      '/dashboard/maintenance',
    )
    expect(screen.getByRole('link', { name: 'Acessar admin' })).toHaveAttribute(
      'href',
      '/platform/login',
    )
    expect(screen.queryByRole('link', { name: 'Configurações' })).not.toBeInTheDocument()
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
      data: { user: { name: 'Maria Silva', email: 'maria@example.com' } },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('notificações')).toBeInTheDocument()
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
      data: { user: { name: 'Maria Locatária', email: 'maria@example.com' }, papel: 'RENTER' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    expect(screen.queryByRole('link', { name: 'Anunciar Imóvel' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))

    expect(screen.getByRole('link', { name: 'Tornar corretor' })).toHaveAttribute(
      'href',
      '/register/details?profile=corretor',
    )
  })

  it('AGENT: oferece criar imobiliária no menu de perfil', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Carlos Corretor', email: 'carlos@example.com' }, papel: 'AGENT' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)

    renderMarketplaceHeader()

    await user.click(screen.getByRole('button', { name: 'Abrir perfil' }))

    expect(screen.getByRole('link', { name: 'Criar imobiliária' })).toHaveAttribute(
      'href',
      '/register/details?profile=imobiliaria',
    )
  })

  it('ADMIN: nÃ£o mostra a aÃ§Ã£o de troca de modalidade no menu de perfil', async () => {
    const user = userEvent.setup()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ana Admin', email: 'ana@example.com' }, papel: 'ADMIN' },
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
    expect(routerMock.replace).toHaveBeenCalledWith('/pt')
    expect(routerMock.refresh).toHaveBeenCalledOnce()
  })
})
