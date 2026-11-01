import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardLayout from '@/app/[locale]/(dashboard)/layout'
import DashboardSectionLayout from '@/app/[locale]/(dashboard)/dashboard/layout'
import { usePathname } from '@/i18n/navigation'
import { theme } from '@shared/theme/theme'

const { getServerSessionMock, redirectMock, routerMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
  routerMock: { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() },
}))

// Server message loading is verified separately; JSDOM renders the client shell.
vi.mock('@/i18n/scoped-messages', () => ({
  ScopedMessages: ({ children }: { children: import('react').ReactNode }) => children,
}))

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }))
vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('@shared/lib/auth/auth-options', () => ({ authOptions: {} }))
vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  redirect: redirectMock,
  useRouter: () => routerMock,
}))
vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')
  return {
    ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
    usePathname: vi.fn(),
    useRouter: () => routerMock,
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})
vi.mock('@shared/hooks/use-dashboard-face-check-notifications', () => ({
  useDashboardFaceCheckNotifications: () => [],
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

const renterSession = {
  scope: 'tenant',
  tenantId: 'tenant-1',
  role: 'RENTER',
  user: { id: 'renter-1', name: 'Renter', email: 'renter@example.test' },
} as const

describe('Authenticated dashboard layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue(renterSession)
    vi.mocked(useSession).mockReturnValue({
      data: renterSession,
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
  })

  it.each(['/dashboard/agenda', '/dashboard/properties'] as const)(
    'lets a renter reach %s through the server layout and AppShell',
    async (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname)
      const content = await DashboardLayout({
        params: Promise.resolve({ locale: 'pt-BR' }),
        children: (
          <DashboardSectionLayout>
            <div data-testid="protected-page">{pathname}</div>
          </DashboardSectionLayout>
        ),
      })

      render(<ThemeProvider theme={theme}>{content}</ThemeProvider>)

      expect(screen.getByTestId('protected-page')).toBeVisible()
      expect(redirectMock).not.toHaveBeenCalled()
      expect(routerMock.replace).not.toHaveBeenCalled()
    },
  )

  it.each([null, { scope: 'platform' }])('still requires a tenant session: %j', async (session) => {
    getServerSessionMock.mockResolvedValue(session)

    await expect(
      DashboardLayout({
        params: Promise.resolve({ locale: 'pt-BR' }),
        children: <div>Protected content</div>,
      }),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/pt/login')
  })
  it('returns an unavailable screen without rendering protected children or redirecting to login', async () => {
    getServerSessionMock.mockResolvedValueOnce({ authUnavailable: true, user: { id: 'u1' } })
    const result = await DashboardLayout({
      params: Promise.resolve({ locale: 'pt-BR' }),
      children: <div>Private fresh data</div>,
    })
    render(<ThemeProvider theme={theme}>{result}</ThemeProvider>)
    expect(screen.getByText('Autenticação temporariamente indisponível')).toBeInTheDocument()
    expect(screen.queryByText('Private fresh data')).not.toBeInTheDocument()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
