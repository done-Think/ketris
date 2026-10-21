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

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }))
vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('@shared/lib/auth/auth-options', () => ({ authOptions: {} }))
vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  useRouter: () => routerMock,
}))
vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')
  return {
    usePathname: vi.fn(),
    useRouter: () => routerMock,
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

const renterSession = {
  scope: 'tenant',
  tenantId: 'tenant-1',
  papel: 'RENTER',
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
})
