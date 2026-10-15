import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformTenantsPage } from '../../components/PlatformTenantsPage'

const { useTenants, mutateAsync, enqueueSnackbar } = vi.hoisted(() => ({
  useTenants: vi.fn(),
  mutateAsync: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))
vi.mock('../../hooks/use-tenants', () => ({ useTenants }))
vi.mock('../../hooks/use-update-tenant-account', () => ({
  useUpdateTenantAccount: () => ({ mutateAsync, isPending: false }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

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
          accountType: 'AGENCY',
          status: 'ACTIVE',
          canceledAt: null,
          createdAt: '2026-09-01T12:00:00Z',
          monthlyCharge: {
            usageUnit: 'BROKERS',
            usage: 4,
            includedUnits: 10,
            extraUnits: 0,
            basePrice: 199.99,
            extraAmount: 0,
            total: 199.99,
          },
        },
        {
          id: 'roberto',
          name: 'Roberto Lima',
          slug: 'roberto',
          accountType: 'BROKER',
          status: 'TRIAL',
          canceledAt: null,
          createdAt: '2026-10-02T12:00:00Z',
          monthlyCharge: {
            usageUnit: 'PROPERTIES',
            usage: 12,
            includedUnits: 10,
            extraUnits: 2,
            basePrice: 99.99,
            extraAmount: 19.98,
            total: 119.97,
          },
        },
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
    expect(screen.getByRole('link', { name: 'Roberto Lima' })).toHaveAttribute(
      'href',
      '/platform/tenants/roberto',
    )
    expect(screen.getByText('roberto')).toBeVisible()
  })

  it('opens the real tenant creation page from the New Tenant button', () => {
    renderPage()

    expect(screen.getByRole('link', { name: 'Novo Tenant' })).toHaveAttribute(
      'href',
      '/platform/tenants/new',
    )
  })

  it('shows the account type and status of each tenant', () => {
    renderPage()

    const horizonte = screen.getByRole('row', { name: /Imobiliária Horizonte/ })
    expect(within(horizonte).getByText('Imobiliária')).toBeVisible()
    expect(within(horizonte).getByText('Ativa')).toBeVisible()

    const roberto = screen.getByRole('row', { name: /Roberto Lima/ })
    expect(within(roberto).getByText('Corretor')).toBeVisible()
    expect(within(roberto).getByText('Em teste')).toBeVisible()
  })

  it('shows the monthly fee of each tenant with its breakdown', async () => {
    const user = userEvent.setup()
    renderPage()

    const horizonte = screen.getByRole('row', { name: /Imobiliária Horizonte/ })
    expect(within(horizonte).getByText(/R\$\s*199,99/)).toBeVisible()

    const roberto = screen.getByRole('row', { name: /Roberto Lima/ })
    await user.hover(within(roberto).getByText(/R\$\s*119,97/))
    expect(await screen.findByText(/R\$\s*99,99 \+ 2 imóveis extras \(R\$\s*19,98\)/)).toBeVisible()
  })

  it('edits the account type and status of a tenant', async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValue({})
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Editar conta de Roberto Lima' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Roberto Lima')).toBeVisible()

    await user.click(within(dialog).getByRole('combobox', { name: 'Tipo de conta' }))
    await user.click(await screen.findByRole('option', { name: 'Pessoa física' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Situação' }))
    await user.click(await screen.findByRole('option', { name: 'Cancelada' }))
    expect(
      within(dialog).getByText('A data de cancelamento é registrada e entra no churn deste mês.'),
    ).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      tenantId: 'roberto',
      accountType: 'INDIVIDUAL',
      status: 'CANCELED',
    })
    expect(enqueueSnackbar).toHaveBeenCalledWith('Conta atualizada.', { variant: 'success' })
  })

  it('does not show the old sample tenants, plans or MRR column', () => {
    renderPage()

    expect(screen.queryByText('Silva & Corretores Associados')).not.toBeInTheDocument()
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    expect(screen.queryByText('MRR')).not.toBeInTheDocument()
  })

  it('shows the empty state when there are no tenants', () => {
    vi.mocked(useTenants).mockReturnValue({ data: [], isLoading: false, isError: false })
    renderPage()

    expect(screen.getByText('Nenhuma imobiliária cadastrada ainda.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Novo Tenant' })).toBeVisible()
  })

  it('shows a loading indicator, not the empty state, while the tenants are pending', () => {
    vi.mocked(useTenants).mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: false,
      isError: false,
    })
    renderPage()

    expect(screen.getByRole('progressbar')).toBeVisible()
    expect(screen.queryByText('Nenhuma imobiliária cadastrada ainda.')).not.toBeInTheDocument()
  })

  it('shows the load error instead of sample data when the request fails', () => {
    vi.mocked(useTenants).mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderPage()

    expect(screen.getByText('Não foi possível carregar as imobiliárias.')).toBeVisible()
  })
})
