import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@mui/material'
import { theme } from '@shared/theme/theme'
import { ChargesPage } from '../components/ChargesPage'
import { ChargeDetailsPage } from '../components/ChargeDetailsPage'
import type { ApiCharge, ApiChargeListItem } from '../types/service'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'tenant-1' }, status: 'authenticated' }),
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))
vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const { default: charges } = await import('@/i18n/messages/pt-BR/charges.json')
  const { default: dashboard } = await import('@/i18n/messages/pt-BR/dashboard.json')
  const { default: common } = await import('@/i18n/messages/pt-BR/common.json')
  return {
    ...actual,
    useLocale: () => 'pt-BR',
    useTranslations: (
      namespace?:
        | 'charges'
        | 'charges.details'
        | 'charges.statuses'
        | 'charges.createDialog'
        | 'charges.editDialog'
        | 'charges.archiveDialog'
        | 'dashboard.notificationsCenter'
        | 'common.dashboardPagination',
    ) =>
      actual.createTranslator({
        locale: 'pt-BR',
        messages: { charges, dashboard, common },
        namespace,
      }),
  }
})

const chargeListItems: ApiChargeListItem[] = [
  {
    id: '0341',
    code: '#COB-2025-0341',
    type: 'A_RECEBER',
    status: 'PAGA',
    amount: 4500,
    dueDate: '2025-03-05',
    description: null,
    contractId: 'contract-1',
    payerName: 'Bruno Oliveira',
    propertyTitle: 'Apt Jardins 3q - 12',
    updatedAt: '2025-03-05T00:00:00.000Z',
  },
  {
    id: '0340',
    code: '#COB-2025-0340',
    type: 'A_RECEBER',
    status: 'PENDENTE',
    amount: 2800,
    dueDate: '2025-03-10',
    description: null,
    contractId: 'contract-2',
    payerName: 'Mariana Souza',
    propertyTitle: 'Studio Pinheiros',
    updatedAt: '2025-03-10T00:00:00.000Z',
  },
  {
    id: '0339',
    code: '#COB-2025-0339',
    type: 'A_RECEBER',
    status: 'ATRASADA',
    amount: 9200,
    dueDate: '2025-03-01',
    description: null,
    contractId: 'contract-3',
    payerName: 'Carlos Eduardo',
    propertyTitle: 'Casa Morumbi 4q',
    updatedAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: '0338',
    code: '#COB-2025-0338',
    type: 'A_RECEBER',
    status: 'AGENDADA',
    amount: 3600,
    dueDate: '2025-03-15',
    description: null,
    contractId: 'contract-4',
    payerName: 'Ana Julia Costa',
    propertyTitle: 'Apt Brooklin 2q',
    updatedAt: '2025-03-15T00:00:00.000Z',
  },
  {
    id: '0337',
    code: '#COB-2025-0337',
    type: 'A_RECEBER',
    status: 'PAGA',
    amount: 5400,
    dueDate: '2025-03-05',
    description: null,
    contractId: 'contract-5',
    payerName: 'Rodrigo Santos',
    propertyTitle: 'Sala Com. Paulista',
    updatedAt: '2025-03-05T00:00:00.000Z',
  },
  {
    id: '0336',
    code: '#COB-2025-0336',
    type: 'A_RECEBER',
    status: 'CANCELADA',
    amount: 15000,
    dueDate: '2025-02-28',
    description: null,
    contractId: 'contract-6',
    payerName: 'Beatriz Mello',
    propertyTitle: 'Cobertura Itaim',
    updatedAt: '2025-02-28T00:00:00.000Z',
  },
  {
    id: '0335',
    code: '#COB-2025-0335',
    type: 'A_RECEBER',
    status: 'PENDENTE',
    amount: 3100,
    dueDate: '2025-03-20',
    description: null,
    contractId: 'contract-7',
    payerName: 'Lucas Almeida',
    propertyTitle: 'Loft Vila Madalena',
    updatedAt: '2025-03-20T00:00:00.000Z',
  },
  {
    id: '0334',
    code: '#COB-2025-0334',
    type: 'A_PAGAR',
    status: 'PENDENTE',
    amount: 1100,
    dueDate: '2025-03-08',
    description: 'Condomínio Jardins',
    contractId: null,
    payerName: null,
    propertyTitle: 'Apt Jardins 3q - 12',
    updatedAt: '2025-03-08T00:00:00.000Z',
  },
  {
    id: '0333',
    code: '#COB-2025-0333',
    type: 'A_PAGAR',
    status: 'PAGA',
    amount: 420,
    dueDate: '2025-03-02',
    description: 'Energia Paulista',
    contractId: null,
    payerName: null,
    propertyTitle: 'Studio Pinheiros',
    updatedAt: '2025-03-02T00:00:00.000Z',
  },
  {
    id: '0332',
    code: '#COB-2025-0332',
    type: 'A_PAGAR',
    status: 'AGENDADA',
    amount: 180,
    dueDate: '2025-03-12',
    description: 'Internet Fibra',
    contractId: null,
    payerName: null,
    propertyTitle: 'Casa Morumbi 4q',
    updatedAt: '2025-03-12T00:00:00.000Z',
  },
]

const fullCharges: Record<string, ApiCharge> = {
  '0340': {
    id: '0340',
    code: '#COB-2025-0340',
    type: 'A_RECEBER',
    status: 'PENDENTE',
    amount: 2800,
    dueDate: '2025-03-10',
    description: null,
    paymentMethod: null,
    receiptUrl: null,
    paidAt: null,
    createdAt: '2025-02-25T09:00:00.000Z',
    updatedAt: '2025-02-25T09:00:00.000Z',
    contractId: 'contract-2',
    contractCode: '#CTR-2025-0088',
    propertyId: 'property-2',
    propertyTitle: 'Studio Pinheiros',
    propertyAddress: 'Rua dos Pinheiros, 200 - Pinheiros, São Paulo - SP',
    payerName: 'Mariana Souza',
    payerEmail: 'mariana.souza@example.com',
  },
  '0333': {
    id: '0333',
    code: '#COB-2025-0333',
    type: 'A_PAGAR',
    status: 'PAGA',
    amount: 420,
    dueDate: '2025-03-02',
    description: 'Energia Paulista',
    paymentMethod: 'Boleto',
    receiptUrl: 'REC-0333',
    paidAt: '2025-03-02T00:00:00.000Z',
    createdAt: '2025-02-25T09:00:00.000Z',
    updatedAt: '2025-03-02T00:00:00.000Z',
    contractId: null,
    contractCode: null,
    propertyId: null,
    propertyTitle: 'Studio Pinheiros',
    propertyAddress: 'Rua dos Pinheiros, 200 - Pinheiros, São Paulo - SP',
    payerName: null,
    payerEmail: null,
  },
}

const createChargeMutate = vi.fn()
const updateChargeMutate = vi.fn()
const registerChargePaymentMutate = vi.fn()
const chargeQueryState: Record<string, { data: ApiCharge | undefined; isLoading: boolean }> = {}

vi.mock('../hooks/use-financial', () => ({
  useCharges: () => ({
    data: { items: chargeListItems, totalCount: chargeListItems.length },
    isLoading: false,
  }),
  useCreateCharge: () => ({ mutate: createChargeMutate }),
  useUpdateCharge: () => ({ mutate: updateChargeMutate }),
  useCharge: (_tenantId: unknown, chargeId: string) =>
    chargeQueryState[chargeId] ?? { data: undefined, isLoading: false },
  useRegisterChargePayment: () => ({ mutate: registerChargePaymentMutate }),
}))

const wrap = (node: React.ReactNode) => <ThemeProvider theme={theme}>{node}</ThemeProvider>
const detail = (id: string) => wrap(<ChargeDetailsPage chargeId={id} />)

beforeEach(() => {
  vi.clearAllMocks()
  chargeQueryState['0340'] = { data: fullCharges['0340'], isLoading: false }
  chargeQueryState['0333'] = { data: fullCharges['0333'], isLoading: false }
  createChargeMutate.mockImplementation((_values, options) => options?.onSuccess?.())
  updateChargeMutate.mockImplementation((variables, options) =>
    options?.onSuccess?.(fullCharges[variables.id] ?? fullCharges['0340']),
  )
  registerChargePaymentMutate.mockImplementation((_values, options) =>
    options?.onSuccess?.(fullCharges['0340']),
  )
})

describe('charges list', () => {
  it('renders six rows, paginates, searches, filters status and switches direction', async () => {
    const user = userEvent.setup()
    render(wrap(<ChargesPage />))
    expect(screen.getAllByRole('row')).toHaveLength(7)
    await user.click(screen.getByRole('button', { name: /next page/i }))
    expect(screen.getByText('Lucas Almeida')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Pendente 2' }))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await user.type(
      screen.getByRole('textbox', { name: 'Buscar locatário ou imóvel...' }),
      'Mariana',
    )
    expect(screen.queryByText('Lucas Almeida')).not.toBeInTheDocument()
    expect(screen.getByText('Mariana Souza')).toBeVisible()
    await user.clear(screen.getByRole('textbox', { name: 'Buscar locatário ou imóvel...' }))
    await user.click(screen.getByRole('tab', { name: 'A pagar' }))
    expect(screen.getByRole('tab', { name: 'A pagar' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Energia Paulista')).toBeVisible()
    expect(screen.queryByText('Mariana Souza')).not.toBeInTheDocument()
  })

  it('validates and submits the create charge form', async () => {
    const user = userEvent.setup()
    render(wrap(<ChargesPage />))
    await user.click(screen.getByRole('button', { name: 'Nova Cobrança' }))
    await user.click(screen.getByRole('button', { name: 'Criar cobrança' }))
    expect(await screen.findByText('Informe a descrição')).toBeVisible()
    await user.type(screen.getByLabelText('Descrição'), 'Aluguel avulso')
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '1250' } })
    fireEvent.change(screen.getByLabelText('Vencimento'), { target: { value: '2025-03-22' } })
    await user.click(screen.getByRole('button', { name: 'Criar cobrança' }))
    await waitFor(() => expect(createChargeMutate).toHaveBeenCalledTimes(1))
    expect(createChargeMutate.mock.calls[0][0]).toMatchObject({
      description: 'Aluguel avulso',
      amount: 1250,
      dueDate: '2025-03-22',
      direction: 'receivable',
      status: 'pending',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('edits a charge from the actions menu', async () => {
    const user = userEvent.setup()
    render(wrap(<ChargesPage />))
    await user.click(screen.getByRole('button', { name: 'Ações #COB-2025-0340' }))
    expect(screen.queryByRole('menuitem', { name: /Visualizar/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    await user.clear(screen.getByLabelText('Descrição'))
    await user.type(screen.getByLabelText('Descrição'), 'Aluguel Studio Pinheiros')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(updateChargeMutate).toHaveBeenCalledTimes(1))
    const [variables] = updateChargeMutate.mock.calls[0]
    expect(variables.id).toBe('0340')
    expect(variables.values).toMatchObject({ description: 'Aluguel Studio Pinheiros' })
  })

  it('confirms archive as a status change to cancelled', async () => {
    const user = userEvent.setup()
    render(wrap(<ChargesPage />))
    await user.click(screen.getByRole('button', { name: 'Ações #COB-2025-0340' }))
    await user.click(screen.getByRole('menuitem', { name: 'Arquivar' }))
    expect(screen.getByText('Arquivar cobrança?')).toBeVisible()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Arquivar' }))
    await waitFor(() => expect(updateChargeMutate).toHaveBeenCalledTimes(1))
    const [variables] = updateChargeMutate.mock.calls[0]
    expect(variables.id).toBe('0340')
    expect(variables.values).toMatchObject({ status: 'cancelled' })
  })
})

describe('charge details', () => {
  it('renders charge details fetched from the API', async () => {
    render(detail('0340'))
    expect(await screen.findByText('#COB-2025-0340')).toBeVisible()
    expect(screen.getByText('Mariana Souza')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Registrar pagamento' })).not.toBeDisabled()
  })

  it('validates and records payment', async () => {
    const user = userEvent.setup()
    render(detail('0340'))
    await screen.findByText('#COB-2025-0340')
    await user.click(screen.getByRole('button', { name: 'Registrar pagamento' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar pagamento' }))
    expect(registerChargePaymentMutate).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Data do pagamento'), {
      target: { value: '2025-03-12' },
    })
    await user.type(screen.getByLabelText('Forma de pagamento'), 'Transferência')
    await user.click(screen.getByRole('button', { name: 'Confirmar pagamento' }))
    await waitFor(() => expect(registerChargePaymentMutate).toHaveBeenCalledTimes(1))
    expect(registerChargePaymentMutate.mock.calls[0][0]).toMatchObject({
      paymentDate: '2025-03-12',
      paymentMethod: 'Transferência',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('renders coherent paid data and disables payment for an already paid charge', async () => {
    render(detail('0333'))
    expect(await screen.findByText('#COB-2025-0333')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Registrar pagamento' })).toBeDisabled()
    expect(screen.getByText('REC-0333')).toBeVisible()
  })

  it('shows a loading state while the charge is being fetched', () => {
    chargeQueryState.loading = { data: undefined, isLoading: true }
    render(detail('loading'))
    expect(screen.getByRole('progressbar')).toBeVisible()
  })

  it('handles an unknown charge with explicit navigation to the list', async () => {
    const user = userEvent.setup()
    render(detail('missing'))
    expect(await screen.findByText('Cobrança não encontrada.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Voltar para Cobranças' }))
    expect(push).toHaveBeenCalledWith('/dashboard/finance/charges')
  })
})
