import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { DashboardRouteShell } from '../../components/DashboardRouteShell'

vi.mock('next/navigation', () => ({
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

  it.each(['/dashboard', '/dashboard/imoveis'])(
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
    '/dashboard/propostas',
    '/dashboard/imoveis/novo',
    '/dashboard/imoveis/property-123',
    '/dashboard/agenda',
    '/dashboard/financeiro',
    '/dashboard/leads',
  ])('preserves the previous sidebar shell on %s', (pathname) => {
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
