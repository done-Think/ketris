import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'
import { usePathname } from '@/i18n/navigation'

import { PlatformOverview } from '../../components/PlatformOverview'
import { PlatformShell } from '../../components/PlatformShell'

const { useTenants } = vi.hoisted(() => ({ useTenants: vi.fn() }))

type MockLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href?: string | { pathname: string; params?: Record<string, string> }
}

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: () => <div aria-label="Growth trends chart" />,
}))

vi.mock('../../hooks/use-tenants', () => ({ useTenants }))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'tenant-1' }, status: 'authenticated' }),
}))

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    usePathname: vi.fn(() => '/platform'),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    Link: React.forwardRef<HTMLAnchorElement, MockLinkProps>(function MockLocalizedLink(
      { href = '', ...props },
      ref,
    ) {
      const localizedHref =
        typeof href === 'string'
          ? href
          : href.params
            ? Object.entries(href.params).reduce(
                (pathname, [key, value]) => pathname.replace(`[${key}]`, value),
                href.pathname,
              )
            : href.pathname

      return React.createElement('a', { ...props, href: localizedHref, ref })
    }),
  }
})

function renderOverview() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformOverview />
    </ThemeProvider>,
  )
}

describe('PlatformOverview', () => {
  const existingTenant = {
    id: 'existing',
    nome: 'Existing agency',
    slug: 'agency',
    createdAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.mocked(useTenants).mockReturnValue({
      data: [existingTenant],
      isLoading: false,
      isError: false,
    })
  })

  it('renders the demonstration metrics, growth chart, alerts and recent tenants', () => {
    renderOverview()

    expect(screen.getByRole('heading', { name: 'Visão geral da plataforma' })).toBeVisible()
    expect(screen.getAllByText('45')[0]).toBeVisible()
    expect(screen.getByText(/R\$\s*89,6\s*mil/)).toBeVisible()
    expect(screen.getByLabelText('Growth trends chart')).toBeVisible()
    expect(screen.getByText('4 ativos')).toBeVisible()
    expect(screen.getByText('Backup automatizado falhou')).toBeVisible()
    expect(screen.getByText('Apex Brokers S/A')).toBeVisible()
    expect(screen.getByText('Nobre Imobiliária')).toBeVisible()
  })

  it('renders all five fixture tenants in the accessible grid', () => {
    renderOverview()

    const grid = screen.getByRole('grid')
    expect(grid).toBeVisible()
    expect(within(grid).getAllByRole('row')).toHaveLength(6)
  })

  it('restores the real-tenant administrative flow from the overview inside the shell', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlatformShell>
          <PlatformOverview />
        </PlatformShell>
      </ThemeProvider>,
    )

    expect(screen.getByText('Imobiliárias cadastradas')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Existing agency' })).toHaveAttribute(
      'href',
      '/platform/tenants/existing',
    )
  })

  it('renders the shared mobile header actions', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlatformShell>
          <div>Overview content</div>
        </PlatformShell>
      </ThemeProvider>,
    )

    expect(screen.getByRole('button', { name: /notifica/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /Abrir navega/i })).toBeVisible()
  })
})

describe('PlatformShell', () => {
  it.each([
    ['/platform', 'Visão geral'],
    ['/platform/tenants', 'Tenants'],
    ['/platform/system', 'Sistema'],
    ['/platform/tenants/new', 'Tenants'],
    ['/platform/admins/new', 'Usuários'],
  ] as const)('marks the current navigation item for %s', (pathname, name) => {
    vi.mocked(usePathname).mockReturnValue(pathname)
    render(
      <ThemeProvider theme={theme}>
        <PlatformShell>Content</PlatformShell>
      </ThemeProvider>,
    )
    expect(screen.getAllByRole('link', { name })[0]).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('link', { name: 'Usuários' })[0]).toHaveAttribute(
      'href',
      '/platform/admins/new',
    )
    vi.mocked(usePathname).mockReturnValue('/platform')
  })

  it('marks Overview as the active platform navigation item', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlatformShell>
          <div>Overview content</div>
        </PlatformShell>
      </ThemeProvider>,
    )

    expect(screen.getAllByRole('link', { name: 'Visão geral' })[0]).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByText('Online')[0]).toBeVisible()
  })

  it('opens and closes the mobile platform navigation', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider theme={theme}>
        <PlatformShell>
          <div>Overview content</div>
        </PlatformShell>
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Abrir navegação da plataforma/ }))
    const closeNavigation = await screen.findByRole('button', {
      name: /Fechar navegação da plataforma/,
    })
    await user.click(closeNavigation)
    expect(
      screen.queryByRole('button', { name: /Fechar navegação da plataforma/ }),
    ).not.toBeInTheDocument()
  })
})
