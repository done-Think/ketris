import { ThemeProvider } from '@mui/material'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePathname } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { theme } from '@shared/theme/theme'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'

import { AppShell } from '../../../components/layout/AppShell'

const { routerMock } = vi.hoisted(() => ({
  routerMock: {
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  },
}))

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
    usePathname: vi.fn(),
    useRouter: vi.fn(() => routerMock),
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@shared/lib/auth/clear-client-session', () => ({
  clearClientSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

function mockSession(overrides?: Partial<{ role: 'OWNER' | 'AGENT' | 'RENTER' }>) {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: { id: 'user-1', name: 'Ana', email: 'ana@example.com' },
      scope: 'tenant',
      tenantId: 't1',
      role: overrides?.role ?? 'OWNER',
    },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function mockUnauthenticatedSession() {
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function renderShell() {
  return render(
    <ThemeProvider theme={theme}>
      <AppShell>
        <div>Conteúdo da rota</div>
      </AppShell>
    </ThemeProvider>,
  )
}

describe('AppShell access rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUnauthenticatedSession()
  })

  it.each(['/crm', '/crm/contacts'] as const)(
    'renders %s without requiring a session',
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname)

      renderShell()

      expect(screen.getByText('Conteúdo da rota')).toBeVisible()
      expect(screen.queryByText('Acesso restrito ao CRM')).not.toBeInTheDocument()
    },
  )

  it.each(['/crm/opportunities/[id]', '/dashboard', '/dashboard/finance'] as const)(
    'keeps %s protected without a session',
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname)

      renderShell()

      expect(screen.getByText('Acesso restrito ao CRM')).toBeVisible()
      expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
    },
  )
})

describe('AppShell navigation per papel', () => {
  it.each([
    '/dashboard/agenda',
    '/dashboard/finance/charges',
    '/dashboard/finance/charges/[id]',
    '/dashboard/maintenance',
    '/dashboard/maintenance/[id]',
    '/dashboard/properties',
    '/dashboard/properties/[id]',
  ] as const)('shows charges, tickets, properties and agenda to RENTER on %s', (pathname) => {
    mockSession({ role: 'RENTER' })
    vi.mocked(usePathname).mockReturnValue(pathname)
    renderShell()
    expect(screen.getByText('Conteúdo da rota')).toBeVisible()
    const links = within(screen.getByRole('navigation')).getAllByRole('link')
    expect(links).toHaveLength(4)
    expect(links.map((link) => link.getAttribute('href')).sort()).toEqual([
      '/dashboard/agenda',
      '/dashboard/finance/charges',
      '/dashboard/maintenance',
      '/dashboard/properties',
    ])
  })

  it.each([
    '/dashboard',
    '/dashboard/finance',
    '/dashboard/properties/new',
    '/dashboard/properties/[id]/edit',
    '/crm',
    '/dashboard/contracts',
  ] as const)('redirects RENTER away from %s without rendering its contents', (pathname) => {
    mockSession({ role: 'RENTER' })
    vi.mocked(usePathname).mockReturnValue(pathname)
    renderShell()
    expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
    expect(routerMock.replace).toHaveBeenCalledWith('/dashboard/finance/charges')
  })
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/crm')
  })

  it('OWNER vê Dashboard, Perfil da Imobiliária e Financeiro, mas não o Perfil Público do corretor', () => {
    mockSession({ role: 'OWNER' })

    renderShell()

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Perfil da Imobiliária').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Perfil Público')).toHaveLength(0)
  })

  it.each(['OWNER'] as const)('não exibe Visão Geral Imob. na navegação para %s', (role) => {
    mockSession({ role })

    renderShell()

    expect(screen.queryAllByText('Visão Geral Imob.')).toHaveLength(0)
    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href') === '/dashboard/agency-overview'),
    ).toBe(false)
  })

  it('OWNER também vê Dashboard, Perfil da Imobiliária e Financeiro', () => {
    mockSession({ role: 'OWNER' })

    renderShell()

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Perfil da Imobiliária').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0)
  })

  it('AGENT não vê Dashboard, Perfil da Imobiliária nem Financeiro, mas vê Perfil Público, Pipeline e Contatos', () => {
    mockSession({ role: 'AGENT' })

    renderShell()

    expect(screen.queryAllByText('Dashboard')).toHaveLength(0)
    expect(screen.queryAllByText('Perfil da Imobiliária')).toHaveLength(0)
    expect(screen.queryAllByText('Financeiro')).toHaveLength(0)
    expect(screen.getAllByText('Perfil Público').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pipeline').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Contatos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Meus Imóveis').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Contratos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agenda').length).toBeGreaterThan(0)
  })
})

describe('AppShell active nav item', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSidebarPreferencesStore.getState().setCollapsed(false)
    mockSession({ role: 'OWNER' })
  })

  function activeLabels() {
    const labels = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
      .map((link) => link.textContent)

    return [...new Set(labels)]
  }

  it('marca só o Dashboard como ativo em /dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')

    renderShell()

    expect(activeLabels()).toEqual(['Dashboard'])
  })

  it('marca só o Financeiro como ativo em /dashboard/finance, não o Dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/finance')

    renderShell()

    expect(activeLabels()).toEqual(['Financeiro'])
  })

  it('marca só o Pipeline como ativo em /crm/opportunities/[id]', () => {
    vi.mocked(usePathname).mockReturnValue('/crm/opportunities/[id]')

    renderShell()

    expect(activeLabels()).toEqual(['Pipeline'])
  })

  it('marca só o Contatos como ativo em /crm/contacts, não o Pipeline', () => {
    vi.mocked(usePathname).mockReturnValue('/crm/contacts')

    renderShell()

    expect(activeLabels()).toEqual(['Contatos'])
  })

  it.each([
    ['/dashboard/team' as const, 'Equipe'],
    ['/dashboard/public-profile/agency' as const, 'Perfil da Imobiliária'],
  ])('marca somente %s na navegação correspondente', (pathname, label) => {
    vi.mocked(usePathname).mockReturnValue(pathname)

    renderShell()

    expect(activeLabels()).toEqual([label])
    expect(screen.getAllByRole('button', { name: 'Editar perfil' })[0]).not.toHaveAttribute(
      'aria-current',
    )
  })

  it.each([false, true])(
    'ativa só o bloco do usuário no perfil pessoal (recolhida: %s)',
    (collapsed) => {
      useSidebarPreferencesStore.getState().setCollapsed(collapsed)
      vi.mocked(usePathname).mockReturnValue('/dashboard/profile')

      renderShell()

      expect(activeLabels()).toEqual([])
      expect(screen.getAllByRole('button', { name: 'Editar perfil' })[0]).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(useSidebarPreferencesStore.getState().isCollapsed).toBe(collapsed)
    },
  )

  it('remove o destaque do perfil ao voltar para o Dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/profile')
    const { rerender } = renderShell()

    vi.mocked(usePathname).mockReturnValue('/dashboard')
    rerender(
      <ThemeProvider theme={theme}>
        <AppShell>
          <div>Conteúdo da rota</div>
        </AppShell>
      </ThemeProvider>,
    )

    expect(activeLabels()).toEqual(['Dashboard'])
    expect(screen.getAllByRole('button', { name: 'Editar perfil' })[0]).not.toHaveAttribute(
      'aria-current',
    )
  })
})

describe('AppShell mobile top bar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    mockSession({ role: 'OWNER' })
  })

  it('shows a single notifications bell next to the menu button', () => {
    renderShell()

    expect(screen.getAllByRole('button', { name: 'Abrir notificações do dashboard' })).toHaveLength(
      1,
    )
  })
})

describe('AppShell navigation while the session is loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/crm')
    vi.mocked(useSession).mockReturnValue({
      data: undefined,
      status: 'loading',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
  })

  it('shows placeholders instead of flashing an incomplete role-filtered menu', () => {
    renderShell()

    expect(screen.queryByText('Pipeline')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument()
  })
})

describe('AppShell collapsible desktop navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSidebarPreferencesStore.getState().setCollapsed(false)
    vi.mocked(usePathname).mockReturnValue('/dashboard/agenda')
    mockSession({ role: 'OWNER' })
  })

  it('keeps the active navigation item while toggling the desktop sidebar', async () => {
    const user = userEvent.setup()

    const { unmount } = renderShell()

    await user.click(screen.getByRole('button', { name: 'Recolher navegação' }))

    expect(screen.getByRole('button', { name: 'Expandir navegação' })).toBeVisible()
    expect(
      screen
        .getAllByRole('link', { name: 'Agenda' })
        .some((link) => link.getAttribute('aria-current') === 'page'),
    ).toBe(true)
    expect(localStorage.getItem('ketris-sidebar-preferences')).toContain('"isCollapsed":true')

    unmount()
    renderShell()

    expect(screen.getByRole('button', { name: 'Expandir navegação' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Expandir navegação' }))

    expect(screen.getAllByText('Agenda').length).toBeGreaterThan(0)
  })

  it('renders the collapse control as an icon on the sidebar edge, outside the aside', () => {
    renderShell()

    const collapseButton = screen.getByRole('button', { name: 'Recolher navegação' })
    const sidebar = collapseButton.parentElement?.querySelector('aside')

    expect(collapseButton).not.toHaveTextContent('Recolher menu')
    expect(collapseButton.closest('aside')).toBeNull()
    expect(sidebar).not.toBeNull()
  })

  it('shows translated tooltips for collapsed navigation icons', async () => {
    const user = userEvent.setup()

    renderShell()

    await user.click(screen.getByRole('button', { name: /recolher navega/i }))
    await user.hover(screen.getByRole('link', { name: /meus im/i }))

    expect(await screen.findByRole('tooltip', { name: /meus im/i })).toBeVisible()
  })

  it('opens the authenticated user profile from the expanded sidebar', async () => {
    renderShell()

    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Editar perfil' })[0])

    expect(routerMock.push).toHaveBeenCalledWith('/dashboard/profile')
  })

  it('opens the same profile from the collapsed sidebar', async () => {
    useSidebarPreferencesStore.getState().setCollapsed(true)
    renderShell()

    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Editar perfil' })[0])

    expect(routerMock.push).toHaveBeenCalledWith('/dashboard/profile')
    expect(useSidebarPreferencesStore.getState().isCollapsed).toBe(true)
  })
})

describe('AppShell marketplace logout shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/dashboard/properties')
    mockSession({ role: 'OWNER' })
  })

  it('clears the session before returning to the public marketplace', async () => {
    const user = userEvent.setup()

    renderShell()

    await user.click(screen.getAllByRole('button', { name: /sair e voltar/i })[0])

    expect(clearClientSession).toHaveBeenCalledOnce()
    expect(routerMock.replace).toHaveBeenCalledWith('/')
    expect(routerMock.refresh).not.toHaveBeenCalled()
  })

  it('unmounts the entire dashboard while logout is pending and never renders the anonymous fallback', async () => {
    let finishLogout: () => void = () => {}
    vi.mocked(clearClientSession).mockReturnValueOnce(
      new Promise((resolve) => {
        finishLogout = resolve
      }),
    )
    const user = userEvent.setup()
    const view = renderShell()
    await user.click(screen.getAllByRole('button', { name: /sair e voltar/i })[0])
    expect(screen.getByRole('status')).toHaveTextContent('Saindo da conta…')
    expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Navegação principal' }),
    ).not.toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()

    mockUnauthenticatedSession()
    view.rerender(
      <ThemeProvider theme={theme}>
        <AppShell>
          <div>Conteúdo da rota</div>
        </AppShell>
      </ThemeProvider>,
    )
    expect(screen.queryByText('Equipe Ketris')).not.toBeInTheDocument()
    expect(screen.queryByText('Painel administrativo')).not.toBeInTheDocument()
    expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
    await act(async () => {
      finishLogout()
    })
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/'))
    expect(routerMock.replace).not.toHaveBeenCalledWith('/login')
    expect(routerMock.replace).not.toHaveBeenCalledWith('/dashboard')
    expect(routerMock.refresh).not.toHaveBeenCalled()
    // Client navigation can still be in flight after clearing the cookie.
    expect(screen.getByRole('status')).toHaveTextContent('Saindo da conta…')
    expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
  })

  it('keeps the dashboard hidden after a failed sign-out and allows a retry', async () => {
    vi.mocked(clearClientSession).mockRejectedValueOnce(new Error('Network unavailable'))
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getAllByRole('button', { name: /sair e voltar/i })[0])
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir a saída.')
    expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
    expect(screen.queryByText('Equipe Ketris')).not.toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Tentar sair novamente' }))
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/'))
    expect(clearClientSession).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
  })
})
