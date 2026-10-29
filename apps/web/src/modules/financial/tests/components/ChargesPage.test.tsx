import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChargesPage } from '../../components/ChargesPage'
import { apiCharge, apiListItem, listResponse, summary } from '../fixtures/charge'
import { apiError, renderWithProviders } from '../fixtures/render'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  enqueueSnackbar: vi.fn(),
  session: { user: { id: 'owner' }, tenantId: 'tenant', role: 'OWNER' },
}))
vi.mock('../../services/financial-service', async () => ({
  financialService: (await import('../fixtures/mocks')).financialServiceMock,
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mocks.session, status: 'authenticated' }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }))
vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

const { financialServiceMock: service } = await import('../fixtures/mocks')

const rows = [
  apiListItem(),
  apiListItem({
    id: 'charge-2',
    code: 'COB-2026-0002',
    status: 'PAID',
    payerName: 'Bruno Oliveira',
    propertyTitle: 'Apt Jardins',
  }),
  apiListItem({ id: 'charge-3', code: 'COB-2026-0003', status: 'OVERDUE', payerName: 'Carlos' }),
]

beforeEach(() => {
  vi.resetAllMocks()
  mocks.session.role = 'OWNER'
  service.listCharges.mockResolvedValue({
    ...listResponse(rows, 3),
    statusCounts: { ALL: 3, PENDING: 1, OVERDUE: 1, PAID: 1, SCHEDULED: 0, CANCELED: 0 },
  })
  service.getSummary.mockResolvedValue(summary())
})

const lastListCall = () => service.listCharges.mock.calls.at(-1)?.[0]

async function openRowMenu(code: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Ações ${code}` }))
  return screen.findByRole('menu')
}

describe('ChargesPage', () => {
  it('lists the charges with status counts and the owner KPIs', async () => {
    renderWithProviders(<ChargesPage />)

    expect(await screen.findByText('Mariana Souza')).toBeVisible()
    expect(screen.getByText('Bruno Oliveira')).toBeVisible()
    const filters = screen.getByRole('group', { name: 'Filtrar cobranças por status' })
    expect(within(filters).getByRole('button', { name: /Atrasada/ })).toHaveTextContent('1')
    expect(await screen.findByText('A receber este mês')).toBeVisible()
    expect(service.getSummary).toHaveBeenCalledWith(undefined)
    expect(lastListCall()).toEqual({
      type: 'RECEIVABLE',
      status: undefined,
      search: undefined,
      page: 1,
      pageSize: 6,
    })
  })

  it('filters by the derived overdue status and switches to payables', async () => {
    renderWithProviders(<ChargesPage />)
    await screen.findByText('Mariana Souza')

    await userEvent.click(screen.getByRole('button', { name: /Atrasada/ }))
    await waitFor(() => expect(lastListCall()).toMatchObject({ status: 'OVERDUE' }))

    await userEvent.click(screen.getByRole('tab', { name: 'A pagar' }))
    await waitFor(() =>
      expect(lastListCall()).toMatchObject({ type: 'PAYABLE', status: undefined }),
    )
  })

  it('opens the charge detail from the code', async () => {
    renderWithProviders(<ChargesPage />)
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Ver detalhes COB-2026-0001' }))[0],
    )
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/dashboard/finance/charges/[id]',
      params: { id: 'charge-1' },
    })
  })

  it('creates a charge without letting the user pick paid or cancelled', async () => {
    service.createCharge.mockResolvedValue(apiCharge())
    renderWithProviders(<ChargesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Nova cobrança' }))
    const dialog = await screen.findByRole('dialog')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar cobrança' }))
    expect(await within(dialog).findByText('Informe a descrição')).toBeVisible()
    expect(service.createCharge).not.toHaveBeenCalled()

    await userEvent.type(within(dialog).getByLabelText('Descrição'), 'Taxa de condomínio')
    await userEvent.clear(within(dialog).getByLabelText('Valor'))
    await userEvent.type(within(dialog).getByLabelText('Valor'), '450')
    await userEvent.type(within(dialog).getByLabelText('Vencimento'), '2026-11-05')
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Status inicial' }))
    const options = within(await screen.findByRole('listbox')).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Pendente', 'Agendada'])
    await userEvent.click(options[1])
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar cobrança' }))

    await waitFor(() =>
      expect(service.createCharge).toHaveBeenCalledWith({
        description: 'Taxa de condomínio',
        type: 'RECEIVABLE',
        amount: 450,
        dueDate: '2026-11-05',
        status: 'SCHEDULED',
      }),
    )
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Cobrança criada', { variant: 'success' })
  })

  it('edits an open charge without a status field', async () => {
    service.updateCharge.mockResolvedValue(apiCharge({ amount: 3000 }))
    renderWithProviders(<ChargesPage />)
    const menu = await openRowMenu('COB-2026-0001')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).queryByRole('combobox', { name: 'Status inicial' })).toBeNull()
    expect(
      within(dialog).getByText(
        'Para mudar o status, use registrar pagamento ou cancelar cobrança.',
      ),
    ).toBeVisible()
    await userEvent.clear(within(dialog).getByLabelText('Valor'))
    await userEvent.type(within(dialog).getByLabelText('Valor'), '3000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() =>
      expect(service.updateCharge).toHaveBeenCalledWith('charge-1', {
        description: 'Aluguel outubro',
        type: 'RECEIVABLE',
        amount: 3000,
        dueDate: '2026-10-10',
      }),
    )
  })

  it('only lets a paid charge change its description and hides cancel and delete', async () => {
    service.updateCharge.mockResolvedValue(apiCharge({ status: 'PAID' }))
    renderWithProviders(<ChargesPage />)
    const menu = await openRowMenu('COB-2026-0002')
    expect(within(menu).queryByRole('menuitem', { name: 'Cancelar cobrança' })).toBeNull()
    expect(within(menu).queryByRole('menuitem', { name: 'Excluir' })).toBeNull()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByLabelText('Valor')).toBeDisabled()
    expect(within(dialog).getByLabelText('Vencimento')).toBeDisabled()
    await userEvent.type(within(dialog).getByLabelText('Descrição'), ' (pago)')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() =>
      expect(service.updateCharge).toHaveBeenCalledWith('charge-2', {
        description: 'Aluguel outubro (pago)',
      }),
    )
  })

  it('cancels a charge only with a reason', async () => {
    service.cancelCharge.mockResolvedValue(apiCharge({ status: 'CANCELED' }))
    renderWithProviders(<ChargesPage />)
    const menu = await openRowMenu('COB-2026-0003')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Cancelar cobrança' }))
    const dialog = await screen.findByRole('dialog')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar cobrança' }))
    expect(
      await within(dialog).findByText('Informe o motivo (mínimo de 3 caracteres)'),
    ).toBeVisible()
    await userEvent.type(within(dialog).getByLabelText('Motivo do cancelamento'), 'Rescisão')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar cobrança' }))

    await waitFor(() =>
      expect(service.cancelCharge).toHaveBeenCalledWith('charge-3', { reason: 'Rescisão' }),
    )
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Cobrança cancelada', {
      variant: 'success',
    })
  })

  it('explains why a charge with movement cannot be deleted', async () => {
    service.deleteCharge.mockRejectedValue(apiError('CHARGE_HAS_MOVEMENT'))
    renderWithProviders(<ChargesPage />)
    const menu = await openRowMenu('COB-2026-0001')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Excluir' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('nunca teve movimento'),
        { variant: 'error' },
      ),
    )
    expect(service.deleteCharge).toHaveBeenCalledWith('charge-1')
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it.each(['RENTER', 'PROPERTY_OWNER'])('is read-only for %s', async (role) => {
    mocks.session.role = role
    renderWithProviders(<ChargesPage />)
    await screen.findByText('Mariana Souza')

    expect(screen.queryByRole('button', { name: 'Nova cobrança' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Ações / })).toBeNull()
    expect(screen.queryByText('A receber este mês')).toBeNull()
    expect(service.getSummary).not.toHaveBeenCalled()
  })

  it('shows only receivables to the renter', async () => {
    mocks.session.role = 'RENTER'
    renderWithProviders(<ChargesPage />)
    await screen.findByText('Mariana Souza')

    expect(screen.queryByRole('tab', { name: 'A pagar' })).toBeNull()
    expect(screen.getByText('Consulte as cobranças dos seus contratos.')).toBeVisible()
    expect(lastListCall()).toMatchObject({ type: 'RECEIVABLE' })
  })
})
