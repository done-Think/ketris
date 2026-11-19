import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContractDetailDashboardPage } from '../../components/ContractDetailDashboardPage'
import { contractsService } from '../../services/contracts-service'
import { apiContractFixture } from '../fixtures/contract'

const mocks = vi.hoisted(() => ({
  session: { tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER', accountType: 'AGENCY' },
  search: new URLSearchParams(),
  replace: vi.fn(),
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: mocks.session }) }))
vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  useSearchParams: () => mocks.search,
}))
vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')
  return {
    useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
    Link: ({ href, ...props }: { href: unknown }) =>
      React.createElement('a', { ...props, href: JSON.stringify(href) }),
  }
})
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))

const slots = {
  alerts: <div>pendências do contrato</div>,
  paymentSummary: <div>indicadores das cobranças</div>,
  payments: <div>cobranças por mês</div>,
  tickets: <div>chamados do contrato</div>,
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ContractDetailDashboardPage contractId="contract" slots={slots} />
    </QueryClientProvider>,
  )
}

const managementActions =
  /Editar|Cancelar contrato|Encerrar contrato|Registrar assinatura manual|Confirmar vínculo|Enviar PDF|PDF comprobatório/

beforeEach(() => {
  mocks.session = {
    tenantId: 'agency',
    user: { id: 'manager' },
    role: 'OWNER',
    accountType: 'AGENCY',
  }
  mocks.search = new URLSearchParams()
  mocks.replace.mockReset()
  vi.spyOn(contractsService, 'get').mockResolvedValue(apiContractFixture({ status: 'ACTIVE' }))
  vi.spyOn(contractsService, 'history').mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
  })
})
afterEach(() => vi.restoreAllMocks())

describe('ContractDetailDashboardPage tabs', () => {
  it('opens on the summary and keeps the chosen tab in the URL', async () => {
    show()
    const tabs = within(await screen.findByRole('tablist', { name: 'Seções do contrato' }))
    expect(tabs.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Resumo',
      'Pagamentos',
      'Documentos',
      'Chamados',
    ])
    expect(screen.getByText('Partes e assinaturas')).toBeInTheDocument()
    expect(screen.getByText('pendências do contrato')).toBeInTheDocument()
    fireEvent.click(tabs.getByRole('tab', { name: 'Pagamentos' }))
    expect(mocks.replace).toHaveBeenCalledWith(
      {
        pathname: '/dashboard/contracts/[id]',
        params: { id: 'contract' },
        query: { tab: 'payments' },
      },
      { scroll: false },
    )
  })

  it.each([
    ['payments', ['Aluguel · vence todo dia 5', 'indicadores das cobranças', 'cobranças por mês']],
    ['documents', ['Nenhum documento enviado.']],
    ['tickets', ['chamados do contrato']],
  ])('shows the %s tab read from the URL', async (tab, texts) => {
    mocks.search = new URLSearchParams({ tab })
    show()
    for (const text of texts) expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.queryByText('Partes e assinaturas')).not.toBeInTheDocument()
  })

  it('keeps the agency actions and the PDF upload', async () => {
    mocks.search = new URLSearchParams({ tab: 'documents' })
    show()
    expect(await screen.findByRole('button', { name: 'Encerrar contrato' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Enviar PDF' })).toBeInTheDocument()
  })

  it('hides the payments tab and its alerts from a team broker without finance access', async () => {
    mocks.session = {
      tenantId: 'agency',
      user: { id: 'broker' },
      role: 'AGENT',
      accountType: 'AGENCY',
    }
    mocks.search = new URLSearchParams({ tab: 'payments' })
    show()
    const tabs = within(await screen.findByRole('tablist'))
    expect(tabs.queryByRole('tab', { name: 'Pagamentos' })).not.toBeInTheDocument()
    expect(screen.getByText('Partes e assinaturas')).toBeInTheDocument()
    expect(screen.queryByText('pendências do contrato')).not.toBeInTheDocument()
  })
})

describe('ContractDetailDashboardPage for the renter', () => {
  beforeEach(() => {
    mocks.session = {
      tenantId: 'renters',
      user: { id: 'renter' },
      role: 'RENTER',
      accountType: 'AGENCY',
    }
  })

  it.each(['summary', 'payments', 'documents', 'tickets'])(
    'shows the %s tab without any management action',
    async (tab) => {
      mocks.search = new URLSearchParams({ tab })
      show()
      expect(await screen.findAllByRole('tab')).toHaveLength(4)
      expect(screen.getByRole('link', { name: 'Meu aluguel' })).toBeInTheDocument()
      expect(screen.getByText('pendências do contrato')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: managementActions })).not.toBeInTheDocument()
      expect(screen.queryByText(managementActions)).not.toBeInTheDocument()
      expect(
        screen.queryByText(/Você acompanha este contrato como locador/),
      ).not.toBeInTheDocument()
    },
  )
})
