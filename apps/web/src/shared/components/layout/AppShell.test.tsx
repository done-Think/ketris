import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePathname } from '@/i18n/navigation'
import { theme } from '@shared/theme/theme'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'

import { AppShell } from './AppShell'

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() })),
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

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

function mockSession(overrides?: Partial<{ papel: 'ADMIN' | 'OWNER' | 'AGENT' }>) {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: { name: 'Ana' },
      scope: 'tenant',
      tenantId: 't1',
      papel: overrides?.papel ?? 'ADMIN',
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

function renderShell(props?: { allowLocalDashboardPreview?: boolean }) {
  return render(
    <ThemeProvider theme={theme}>
      <AppShell allowLocalDashboardPreview={props?.allowLocalDashboardPreview}>
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
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/crm')
  })

  it('ADMIN vê Dashboard, Perfil da Imobiliária e Financeiro, mas não o Perfil Público do corretor', () => {
    mockSession({ papel: 'ADMIN' })

    renderShell()

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Perfil da Imobiliária').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Perfil Público')).toHaveLength(0)
  })

  it('OWNER também vê Dashboard, Perfil da Imobiliária e Financeiro', () => {
    mockSession({ papel: 'OWNER' })

    renderShell()

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Perfil da Imobiliária').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0)
  })

  it('AGENT não vê Dashboard, Perfil da Imobiliária nem Financeiro, mas vê Perfil Público, Pipeline e Contatos', () => {
    mockSession({ papel: 'AGENT' })

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
  it('keeps role-filtered navigation during local preview when a session exists', () => {
    mockSession({ papel: 'ADMIN' })

    renderShell({ allowLocalDashboardPreview: true })

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/dashboard/public-profile/agency')
    expect(hrefs).not.toContain('/dashboard/public-profile')
    expect(hrefs).toContain('/dashboard/maintenance')
    expect(hrefs).toContain('/dashboard/finance/charges')
  })
})

describe('AppShell active nav item', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession({ papel: 'ADMIN' })
  })

  // A sidebar é renderizada duas vezes (rail fixo + Drawer mobile com keepMounted), então
  // cada rótulo ativo aparece em dobro — o que importa é o conjunto de rótulos únicos.
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
})

describe('AppShell mobile top bar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    mockSession({ papel: 'ADMIN' })
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
    mockSession({ papel: 'ADMIN' })
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
})
