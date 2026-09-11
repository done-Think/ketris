import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { usePathname } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { DashboardRouteShell } from '../../components/DashboardRouteShell'

vi.mock('@/i18n/navigation', async () => ({
  Link: (await import('next/link')).default,
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

function renderShell() {
  return render(
    <ThemeProvider theme={theme}>
      <DashboardRouteShell>
        <div>Route content</div>
      </DashboardRouteShell>
    </ThemeProvider>,
  )
}

describe('DashboardRouteShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })
  })

  it.each(['/dashboard', '/dashboard/properties'] as const)(
    'uses the isolated owner header on %s',
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname)

      renderShell()

      expect(screen.getByRole('banner')).toBeVisible()
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
      expect(screen.getByRole('main')).toHaveTextContent('Route content')
      expect(
        screen.getByRole('navigation', { name: 'Navegação inferior do proprietário' }),
      ).toBeInTheDocument()
    },
  )

  it.each([
    '/dashboard/proposals',
    '/dashboard/properties/new',
    '/dashboard/properties/[id]',
    '/dashboard/agenda',
    '/dashboard/finance',
    '/dashboard/leads',
  ] as const)('preserves the previous sidebar shell on %s', (pathname) => {
    vi.mocked(usePathname).mockReturnValue(pathname)

    renderShell()

    expect(screen.getByRole('complementary')).toBeVisible()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('Route content')
    expect(
      screen.getByRole('navigation', { name: 'Navegação inferior do proprietário' }),
    ).toBeInTheDocument()
  })
})
