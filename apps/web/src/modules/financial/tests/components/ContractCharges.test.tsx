import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContractChargeAlerts } from '../../components/ContractChargeAlerts'
import { ContractChargeMonths } from '../../components/ContractChargeMonths'
import { ContractChargeSummary } from '../../components/ContractChargeSummary'
import { calendarDayKey } from '../../utils/contract-charges'
import { apiListItem } from '../fixtures/charge'
import { renderWithProviders } from '../fixtures/render'

const mocks = vi.hoisted(() => ({
  session: { user: { id: 'renter' }, tenantId: 'renters', role: 'RENTER' },
}))
vi.mock('../../services/financial-service', async () => ({
  financialService: (await import('../fixtures/mocks')).financialServiceMock,
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mocks.session, status: 'authenticated' }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))

const { financialServiceMock: service } = await import('../fixtures/mocks')

const day = (offset: number) => `${calendarDayKey(new Date(), offset)}T03:00:00.000Z`

const charges = [
  apiListItem({ id: 'late', code: 'COB-1', status: 'OVERDUE', dueDate: day(-40), amount: 2800 }),
  apiListItem({ id: 'paid', code: 'COB-2', status: 'PAID', dueDate: day(-70), amount: 2800 }),
  apiListItem({ id: 'soon', code: 'COB-3', status: 'PENDING', dueDate: day(2), amount: 2800 }),
]

beforeEach(() => {
  vi.resetAllMocks()
  mocks.session = { user: { id: 'renter' }, tenantId: 'renters', role: 'RENTER' }
  service.listContractCharges.mockResolvedValue(charges)
})

describe('ContractChargeMonths', () => {
  it('shows one card per due month with its total and situation', async () => {
    renderWithProviders(<ContractChargeMonths contractId="contract-1" />)

    const months = await screen.findAllByRole('region')
    expect(months).toHaveLength(3)
    expect(service.listContractCharges).toHaveBeenCalledWith('contract-1')
    expect(within(months[0]).getByText('A vencer')).toBeInTheDocument()
    expect(within(months[1]).getByText('Atrasado')).toBeInTheDocument()
    expect(within(months[2]).getByText('Tudo pago')).toBeInTheDocument()
    expect(within(months[1]).getByRole('link', { name: 'Ver cobrança COB-1' })).toHaveAttribute(
      'href',
      '/dashboard/finance/charges/late',
    )
    expect(within(months[1]).getAllByText(/R\$\s2\.800,00/)).toHaveLength(2)
  })

  it('offers the receipt only on the paid charge that has one, and downloads it', async () => {
    const receipt = {
      id: 'receipt-1',
      name: 'comprovante-pix.pdf',
      contentType: 'application/pdf',
      size: 1200,
      uploadedAt: day(-69),
    }
    service.listContractCharges.mockResolvedValue([charges[0], { ...charges[1], receipt }])
    service.downloadReceipt.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<ContractChargeMonths contractId="contract-1" />)

    const [late, paid] = await screen.findAllByRole('region')
    expect(within(late).queryByRole('button', { name: /^Baixar/ })).not.toBeInTheDocument()
    fireEvent.click(within(paid).getByRole('button', { name: 'Baixar comprovante-pix.pdf' }))
    await vi.waitFor(() =>
      expect(service.downloadReceipt).toHaveBeenCalledWith('paid', 'receipt-1'),
    )
  })

  it('tells when the contract has no charges', async () => {
    service.listContractCharges.mockResolvedValue([])
    renderWithProviders(<ContractChargeMonths contractId="contract-1" />)
    expect(
      await screen.findByText('Nenhuma cobrança lançada para este contrato.'),
    ).toBeInTheDocument()
  })
})

describe('ContractChargeSummary', () => {
  it('shows the next due date, the open total and the overdue count', async () => {
    renderWithProviders(<ContractChargeSummary contractId="contract-1" />)

    expect(await screen.findByText('Em aberto (2)')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s5\.600,00/)).toBeInTheDocument()
    expect(screen.getByText('Atrasadas').nextSibling).toHaveTextContent('1')
  })
})

describe('ContractChargeAlerts', () => {
  it('warns the renter about the overdue charge and the one due within 3 days', async () => {
    renderWithProviders(<ContractChargeAlerts contractId="contract-1" />)

    expect(await screen.findByText(/1 cobrança atrasada, somando/)).toBeInTheDocument()
    expect(screen.getByText(/Uma cobrança vence em até 3 dias/)).toBeInTheDocument()
  })

  it('shows the landlord the same pending items', async () => {
    mocks.session = { user: { id: 'landlord' }, tenantId: 'landlord-tenant', role: 'OWNER' }
    renderWithProviders(<ContractChargeAlerts contractId="contract-1" />)

    expect(await screen.findByText(/1 cobrança atrasada/)).toBeInTheDocument()
    expect(screen.getByText(/Uma cobrança vence em até 3 dias/)).toBeInTheDocument()
  })

  it('shows the agency only the overdue charges of the contract', async () => {
    mocks.session = { user: { id: 'manager' }, tenantId: 'tenant', role: 'OWNER' }
    renderWithProviders(<ContractChargeAlerts contractId="contract-1" />)

    expect(await screen.findByText(/1 cobrança atrasada/)).toBeInTheDocument()
    expect(screen.queryByText(/vence em até 3 dias/)).not.toBeInTheDocument()
  })

  it('stays hidden when nothing is late or due soon', async () => {
    service.listContractCharges.mockResolvedValue([charges[1]])
    const { container } = renderWithProviders(<ContractChargeAlerts contractId="contract-1" />)

    await vi.waitFor(() => expect(service.listContractCharges).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
