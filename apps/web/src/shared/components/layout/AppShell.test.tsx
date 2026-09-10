import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePathname } from '@/i18n/navigation'
import { theme } from '@shared/theme/theme'

import { AppShell } from './AppShell'

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

function mockSession(overrides?: Partial<{ papel: 'ADMIN' | 'OWNER' | 'AGENT' }>) {
  vi.mocked(useSession).mockReturnValue({
    data: { user: { name: 'Ana' }, papel: overrides?.papel ?? 'ADMIN' },
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

  it.each([
    '/crm/proposals',
    '/crm/opportunities/[id]',
    '/dashboard',
    '/dashboard/finance',
  ] as const)('keeps %s protected without a session', (pathname) => {
    vi.mocked(usePathname).mockReturnValue(pathname)

    renderShell()

    expect(screen.getByText('Acesso restrito ao CRM')).toBeVisible()
    expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
  })
})

describe('AppShell navigation per papel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/crm')
  })

  it('ADMIN vê todos os itens, incluindo Dashboard, Perfil Público e Financeiro', () => {
    mockSession({ papel: 'ADMIN' })

    renderShell()

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Perfil Público').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0)
  })

  it('OWNER também vê todos os itens', () => {
    mockSession({ papel: 'OWNER' })

    renderShell()

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Perfil Público').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0)
  })

  it('AGENT não vê Dashboard, Perfil Público nem Financeiro, mas vê Pipeline e Contatos', () => {
    mockSession({ papel: 'AGENT' })

    renderShell()

    expect(screen.queryAllByText('Dashboard')).toHaveLength(0)
    expect(screen.queryAllByText('Perfil Público')).toHaveLength(0)
    expect(screen.queryAllByText('Financeiro')).toHaveLength(0)
    expect(screen.getAllByText('Pipeline').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Contatos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Meus Imóveis').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Contratos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agenda').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Propostas').length).toBeGreaterThan(0)
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
