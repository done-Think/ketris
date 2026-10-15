import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformFinancePage } from '../../components/PlatformFinancePage'
import type { ApiPlatformFinance } from '../../types/platform-finance'

const { usePlatformFinance } = vi.hoisted(() => ({ usePlatformFinance: vi.fn() }))
vi.mock('../../hooks/use-platform-finance', () => ({ usePlatformFinance }))

const createdAt = '2026-01-10T12:00:00.000Z'
const finance: ApiPlatformFinance = {
  referenceDate: '2026-10-15T12:00:00.000Z',
  mrr: 1259.94,
  payingAccounts: 3,
  trialAccounts: 1,
  suspendedAccounts: 2,
  canceledThisMonth: 1,
  churnRate: 0.25,
  byAccountType: [
    { accountType: 'INDIVIDUAL', activeAccounts: 0, mrr: 0 },
    { accountType: 'BROKER', activeAccounts: 1, mrr: 119.97 },
    { accountType: 'AGENCY', activeAccounts: 2, mrr: 1139.97 },
  ],
  accounts: [
    {
      id: 'horizonte',
      name: 'Imobiliária Horizonte',
      slug: 'horizonte',
      accountType: 'AGENCY',
      status: 'ACTIVE',
      canceledAt: null,
      createdAt,
      monthlyCharge: {
        usageUnit: 'BROKERS',
        usage: 13,
        includedUnits: 10,
        extraUnits: 3,
        basePrice: 199.99,
        extraAmount: 59.97,
        total: 259.96,
      },
    },
    {
      id: 'roberto',
      name: 'Roberto Lima',
      slug: 'roberto',
      accountType: 'BROKER',
      status: 'TRIAL',
      canceledAt: null,
      createdAt,
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
}

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformFinancePage />
    </ThemeProvider>,
  )
}

describe('PlatformFinancePage', () => {
  beforeEach(() => {
    vi.mocked(usePlatformFinance).mockReturnValue({
      data: finance,
      isPending: false,
      isError: false,
    })
  })

  it('mostra MRR, contas pagantes, em teste e churn do mês', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
    expect(screen.getByText(/outubro de 2026/)).toBeVisible()
    expect(screen.getByText(/^R\$\s*1\.259,94$/)).toBeVisible()
    expect(screen.getByText('Contas pagantes').nextSibling).toHaveTextContent('3')
    expect(screen.getByText('2 suspensas')).toBeVisible()
    expect(screen.getByText('25%')).toBeVisible()
    expect(screen.getByText('1 cancelamento')).toBeVisible()
  })

  it('mostra a receita e a participação de cada tipo de conta', () => {
    renderPage()

    const byType = screen.getByRole('region', { name: 'Receita por tipo de conta' })
    expect(within(byType).getByText('Nenhuma conta ativa')).toBeVisible()
    expect(within(byType).getByText(/^R\$\s*1\.139,97$/)).toBeVisible()
    expect(within(byType).getByText('90%')).toBeVisible()
  })

  it('lista a mensalidade e o uso de cada conta e marca as que ficam fora do MRR', () => {
    renderPage()

    const accounts = screen.getByRole('region', { name: 'Mensalidades por conta' })
    const horizonte = within(accounts).getByRole('row', { name: /Imobiliária Horizonte/ })
    expect(horizonte).toHaveTextContent('13 de 10 corretores · +3 extras')
    expect(within(horizonte).getByText(/R\$\s*259,96/)).toBeVisible()
    expect(within(horizonte).getByText(/inclui R\$\s*59,97 de extras/)).toBeVisible()
    expect(within(horizonte).queryByText('fora do MRR')).not.toBeInTheDocument()
    expect(within(accounts).getByRole('link', { name: 'Imobiliária Horizonte' })).toHaveAttribute(
      'href',
      '/platform/tenants/horizonte',
    )

    const roberto = within(accounts).getByRole('row', { name: /Roberto Lima/ })
    expect(roberto).toHaveTextContent('12 de 10 imóveis · +2 extras')
    expect(within(roberto).getByText('Em teste')).toBeVisible()
    expect(within(roberto).getByText('fora do MRR')).toBeVisible()
  })

  it('mostra "—" no churn quando não havia base no início do mês', () => {
    vi.mocked(usePlatformFinance).mockReturnValue({
      data: { ...finance, churnRate: null, canceledThisMonth: 0 },
      isPending: false,
      isError: false,
    })
    renderPage()

    expect(screen.getByText('—')).toBeVisible()
    expect(screen.getByText('Sem base no início do mês')).toBeVisible()
  })

  it('mostra carregando e erro sem inventar valores', () => {
    vi.mocked(usePlatformFinance).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    })
    const view = renderPage()
    expect(screen.getByRole('progressbar')).toBeVisible()
    view.unmount()

    vi.mocked(usePlatformFinance).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    })
    renderPage()
    expect(screen.getByText('Não foi possível carregar o financeiro.')).toBeVisible()
  })
})
