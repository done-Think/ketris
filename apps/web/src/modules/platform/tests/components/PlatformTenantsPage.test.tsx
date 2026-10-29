import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformTenantsPage } from '../../components/PlatformTenantsPage'
import type { PlatformTenant, TenantListQuery } from '../../types/tenant'

const { useTenantsPage, mutateAsync, enqueueSnackbar, actor } = vi.hoisted(() => ({
  useTenantsPage: vi.fn(),
  mutateAsync: vi.fn(),
  enqueueSnackbar: vi.fn(),
  actor: { key: 'admin-1:ADMIN', enabled: true, canManage: true },
}))
vi.mock('../../hooks/use-platform-actor', () => ({ usePlatformActor: () => actor }))
vi.mock('../../hooks/use-tenants', () => ({
  useTenantsPage,
  useUpdateTenantAccount: () => ({ mutateAsync, isPending: false }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

const tenants: PlatformTenant[] = [
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
]

function serverPage(source: PlatformTenant[]) {
  return ({ q, status, accountType, page, pageSize }: TenantListQuery) => {
    const matches = source.filter(
      (tenant) =>
        (!q || tenant.name.toLowerCase().includes(q) || tenant.slug.includes(q)) &&
        (!accountType || tenant.accountType === accountType),
    )
    const statusCounts = { TRIAL: 0, ACTIVE: 0, SUSPENDED: 0, CANCELED: 0 }
    for (const tenant of matches) statusCounts[tenant.status] += 1
    const visible = matches.filter((tenant) => !status || tenant.status === status)

    return {
      data: { tenants: visible, totalCount: visible.length, page, pageSize, statusCounts },
      isPending: false,
      isError: false,
    }
  }
}

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformTenantsPage />
    </ThemeProvider>,
  )
}

describe('PlatformTenantsPage', () => {
  beforeEach(() => {
    actor.canManage = true
    vi.mocked(useTenantsPage).mockImplementation(serverPage(tenants))
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

    expect(screen.getByRole('link', { name: 'Nova conta' })).toHaveAttribute(
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

  it('counts the accounts by status in the tabs and filters by them', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('tab', { name: /Todas\s*2/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Ativa\s*1/ })).toBeVisible()
    expect(screen.getByRole('tab', { name: /Canceladas?\s*0/ })).toBeVisible()

    await user.click(screen.getByRole('tab', { name: /Em teste\s*1/ }))

    expect(useTenantsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'TRIAL', page: 1 }),
    )
    expect(screen.getByRole('row', { name: /Roberto Lima/ })).toBeVisible()
    expect(screen.queryByRole('row', { name: /Imobiliária Horizonte/ })).not.toBeInTheDocument()
    expect(screen.getByText('1 conta')).toBeVisible()
  })

  it('searches by name or identifier and filters by account type', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Buscar conta'), ' horiz ')
    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Roberto Lima/ })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('row', { name: /Imobiliária Horizonte/ })).toBeVisible()
    expect(useTenantsPage).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'horiz' }))

    await user.clear(screen.getByLabelText('Buscar conta'))
    await user.type(screen.getByLabelText('Buscar conta'), 'roberto')
    expect(await screen.findByRole('row', { name: /Roberto Lima/ })).toBeVisible()

    await user.clear(screen.getByLabelText('Buscar conta'))
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))
    await user.click(screen.getByRole('combobox', { name: 'Tipo de conta' }))
    await user.click(await screen.findByRole('option', { name: 'Imobiliária' }))
    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Roberto Lima/ })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('row', { name: /Imobiliária Horizonte/ })).toBeVisible()
    expect(useTenantsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: undefined, accountType: 'AGENCY' }),
    )
  })

  it('explains when no account matches and clears the filters', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Buscar conta'), 'inexistente')
    expect(await screen.findByText('Nenhuma conta encontrada com esses filtros.')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getByLabelText('Buscar conta')).toHaveValue('')
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))
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
    vi.mocked(useTenantsPage).mockImplementation(serverPage([]))
    renderPage()

    expect(screen.getByText('Nenhuma imobiliária cadastrada ainda.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Nova conta' })).toBeVisible()
  })

  it('shows a loading indicator, not the empty state, while the tenants are pending', () => {
    vi.mocked(useTenantsPage).mockReturnValue({ data: undefined, isPending: true, isError: false })
    renderPage()

    expect(screen.getByRole('progressbar')).toBeVisible()
    expect(screen.queryByText('Nenhuma imobiliária cadastrada ainda.')).not.toBeInTheDocument()
  })

  it('shows the load error instead of sample data when the request fails', () => {
    vi.mocked(useTenantsPage).mockReturnValue({ data: undefined, isPending: false, isError: true })
    renderPage()

    expect(screen.getByText('Não foi possível carregar as imobiliárias.')).toBeVisible()
  })

  it('hides the creation and editing actions from admins without the ADMIN role', () => {
    actor.canManage = false
    renderPage()

    expect(screen.queryByRole('link', { name: 'Nova conta' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Editar conta de Roberto Lima' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Roberto Lima/ })).toBeVisible()
  })

  it('pages through the server results', async () => {
    const user = userEvent.setup()
    vi.mocked(useTenantsPage).mockImplementation((query: TenantListQuery) => ({
      data: {
        ...serverPage(tenants)(query).data,
        totalCount: 45,
      },
      isPending: false,
      isError: false,
    }))
    renderPage()

    expect(screen.getByText('1-20 de 45')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(useTenantsPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  })
})
