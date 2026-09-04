import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { OwnerDashboardHeader } from '../../components/OwnerDashboardHeader'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

function renderHeader() {
  return render(
    <ThemeProvider theme={theme}>
      <OwnerDashboardHeader />
    </ThemeProvider>,
  )
}

describe('OwnerDashboardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'owner-1', name: 'Carlos Oliveira', email: 'carlos@ketris.dev' },
        expires: '2099-12-31T23:59:59.999Z',
        scope: 'tenant',
        tenantId: 'tenant-1',
        papel: 'OWNER',
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
  })

  it('renders the owner profile and marks the current desktop route', () => {
    renderHeader()

    expect(screen.getByRole('link', { name: 'Ketris — Painel do Proprietário' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
    expect(screen.getByText('Carlos Oliveira')).toBeVisible()

    const navigation = screen.getByRole('navigation', {
      name: 'Navegação principal do proprietário',
    })
    expect(within(navigation).getByRole('link', { name: 'Painel' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(navigation).getByRole('link', { name: 'Meus Imóveis' })).toHaveAttribute(
      'href',
      '/dashboard/imoveis',
    )
    expect(within(navigation).getByText('Documentos')).toHaveAttribute('aria-disabled', 'true')
  })

  it('opens and closes the accessible mobile navigation', async () => {
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    const mobileNavigation = await screen.findByRole('navigation', {
      name: 'Navegação móvel do proprietário',
    })
    expect(within(mobileNavigation).getByRole('link', { name: 'Painel' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('navigation', { name: 'Navegação móvel do proprietário' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('keeps nested owner routes active in the navigation', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/imoveis/property-1')

    renderHeader()

    const navigation = screen.getByRole('navigation', {
      name: 'Navegação principal do proprietário',
    })
    expect(within(navigation).getByRole('link', { name: 'Meus Imóveis' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(navigation).getByRole('link', { name: 'Painel' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
