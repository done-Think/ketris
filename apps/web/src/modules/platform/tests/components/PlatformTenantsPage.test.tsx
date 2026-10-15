import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformTenantsPage } from '../../components/PlatformTenantsPage'

const { useTenants } = vi.hoisted(() => ({ useTenants: vi.fn() }))
vi.mock('../../hooks/use-tenants', () => ({ useTenants }))

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformTenantsPage />
    </ThemeProvider>,
  )
}

describe('PlatformTenantsPage', () => {
  beforeEach(() => {
    vi.mocked(useTenants).mockReturnValue({
      data: [
        {
          id: 'horizonte',
          name: 'Imobiliária Horizonte',
          slug: 'horizonte',
          createdAt: '2026-09-01T12:00:00Z',
        },
        { id: 'aurora', name: 'Aurora Imóveis', slug: 'aurora', createdAt: '2026-10-02T12:00:00Z' },
      ],
      isLoading: false,
      isError: false,
    })
  })

  it('lists the real tenants with links to their detail pages', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Imobiliária Horizonte' })).toHaveAttribute(
      'href',
      '/platform/tenants/horizonte',
    )
    expect(screen.getByRole('link', { name: 'Aurora Imóveis' })).toHaveAttribute(
      'href',
      '/platform/tenants/aurora',
    )
    expect(screen.getByText('aurora')).toBeVisible()
  })

  it('opens the real tenant creation page from the New Tenant button', () => {
    renderPage()

    expect(screen.getByRole('link', { name: 'Novo Tenant' })).toHaveAttribute(
      'href',
      '/platform/tenants/new',
    )
  })

  it('does not show sample plans, MRR or sample tenants', () => {
    renderPage()

    expect(screen.queryByText('Silva & Corretores Associados')).not.toBeInTheDocument()
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    expect(screen.queryByText('MRR')).not.toBeInTheDocument()
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument()
  })

  it('shows the empty state when there are no tenants', () => {
    vi.mocked(useTenants).mockReturnValue({ data: [], isLoading: false, isError: false })
    renderPage()

    expect(screen.getByText('Nenhuma imobiliária cadastrada ainda.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Novo Tenant' })).toBeVisible()
  })

  it('shows the load error instead of sample data when the request fails', () => {
    vi.mocked(useTenants).mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderPage()

    expect(screen.getByText('Não foi possível carregar as imobiliárias.')).toBeVisible()
  })
})
