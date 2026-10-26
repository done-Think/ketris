import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChargeDetailsPage } from '../../components/ChargeDetailsPage'
import { apiCharge, auditEvent } from '../fixtures/charge'
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
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))

const { financialServiceMock: service } = await import('../fixtures/mocks')

const receipt = {
  id: 'receipt-1',
  name: 'comprovante.pdf',
  contentType: 'application/pdf',
  size: 2048,
  uploadedAt: '2026-10-08T15:00:00.000Z',
}
const paidCharge = apiCharge({
  status: 'PAGA',
  paidAt: '2026-10-08T00:00:00.000Z',
  paymentMethod: 'PIX',
  receipt,
})

const assign = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  mocks.session.role = 'OWNER'
  service.getCharge.mockResolvedValue(apiCharge())
  service.getHistory.mockResolvedValue({ events: [auditEvent()] })
  vi.stubGlobal('location', { ...window.location, assign })
})
afterEach(() => vi.unstubAllGlobals())

describe('ChargeDetailsPage', () => {
  it('shows the charge details, links and history for the owner', async () => {
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)

    expect(await screen.findByRole('heading', { name: 'COB-2026-0001' })).toBeVisible()
    expect(screen.getByText('CTR-2026-0001')).toBeVisible()
    expect(screen.getByText('mariana@example.com')).toBeVisible()
    expect(screen.getByText('Não paga')).toBeVisible()
    expect(screen.getByText('Nenhum comprovante anexado.')).toBeVisible()
    expect(await screen.findByText('Cobrança criada')).toBeVisible()
    expect(screen.getByText(/Ana Dona/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Registrar pagamento' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Cancelar cobrança' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Estornar pagamento' })).toBeNull()
  })

  it('registers a payment with a receipt', async () => {
    service.uploadReceipt.mockResolvedValue('upload-token')
    service.registerPayment.mockResolvedValue(paidCharge)
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar pagamento' }))
    const dialog = await screen.findByRole('dialog')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar pagamento' }))
    expect(await within(dialog).findByText('Informe a forma de pagamento')).toBeVisible()

    await userEvent.type(within(dialog).getByLabelText('Data do pagamento'), '2026-10-08')
    await userEvent.type(within(dialog).getByLabelText('Forma de pagamento'), 'PIX')
    const file = new File(['%PDF'], 'comprovante.pdf', { type: 'application/pdf' })
    await userEvent.upload(within(dialog).getByLabelText('Anexar comprovante'), file)
    expect(within(dialog).getByText('comprovante.pdf')).toBeVisible()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar pagamento' }))

    await waitFor(() =>
      expect(service.registerPayment).toHaveBeenCalledWith('charge-1', {
        paidAt: '2026-10-08',
        paymentMethod: 'PIX',
        receiptUploadToken: 'upload-token',
      }),
    )
    expect(service.uploadReceipt).toHaveBeenCalledWith('charge-1', file)
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Pagamento registrado', {
      variant: 'success',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('rejects a receipt in an unsupported format before uploading', async () => {
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar pagamento' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Data do pagamento'), '2026-10-08')
    await userEvent.type(within(dialog).getByLabelText('Forma de pagamento'), 'PIX')
    const word = new File(['x'], 'comprovante.docx', { type: 'application/msword' })
    await userEvent.upload(within(dialog).getByLabelText('Anexar comprovante'), word, {
      applyAccept: false,
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar pagamento' }))

    expect(await within(dialog).findByText('Envie um PDF, JPG ou PNG')).toBeVisible()
    expect(service.uploadReceipt).not.toHaveBeenCalled()
    expect(service.registerPayment).not.toHaveBeenCalled()
  })

  it('reverses a paid charge with a reason and downloads the current receipt', async () => {
    service.getCharge.mockResolvedValue(paidCharge)
    service.reversePayment.mockResolvedValue(apiCharge())
    service.downloadReceipt.mockResolvedValue({ url: 'https://s3/receipt', expiresAt: '' })
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)

    expect(await screen.findByText('PIX')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Registrar pagamento' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar cobrança' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Baixar comprovante.pdf' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://s3/receipt'))
    expect(service.downloadReceipt).toHaveBeenCalledWith('charge-1', 'receipt-1')

    await userEvent.click(screen.getByRole('button', { name: 'Estornar pagamento' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Motivo do estorno'), 'Pix devolvido')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Estornar pagamento' }))

    await waitFor(() =>
      expect(service.reversePayment).toHaveBeenCalledWith('charge-1', { reason: 'Pix devolvido' }),
    )
  })

  it('lets the owner download a reversed receipt from the history', async () => {
    service.getHistory.mockResolvedValue({
      events: [
        auditEvent({ id: 'e2', action: 'PAYMENT_REVERSED', reason: 'Pix devolvido', receipt }),
        auditEvent({ id: 'e1', action: 'UPDATED', changedFields: ['amount', 'dueDate'] }),
      ],
    })
    service.downloadReceipt.mockResolvedValue({ url: 'https://s3/old', expiresAt: '' })
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)

    expect(await screen.findByText('Pagamento estornado')).toBeVisible()
    expect(screen.getByText('Motivo: Pix devolvido')).toBeVisible()
    expect(screen.getByText('Alterou: valor, vencimento')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Baixar comprovante.pdf' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://s3/old'))
  })

  it('shows the cancellation data of a cancelled charge without actions', async () => {
    service.getCharge.mockResolvedValue(
      apiCharge({
        status: 'CANCELADA',
        cancelledAt: '2026-10-09T15:00:00.000Z',
        cancellationReason: 'Contrato rescindido',
      }),
    )
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)

    expect(await screen.findByText('Contrato rescindido')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Registrar pagamento' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Estornar pagamento' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar cobrança' })).toBeNull()
  })

  it('shows the API reason when a concurrent change blocks the cancellation', async () => {
    service.cancelCharge.mockRejectedValue(apiError('CHARGE_CONCURRENT_CHANGE'))
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar cobrança' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Motivo do cancelamento'), 'Duplicada')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar cobrança' }))

    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
        'A cobrança foi alterada por outra pessoa. Recarregue e tente de novo.',
        { variant: 'error' },
      ),
    )
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it.each(['RENTER', 'PROPERTY_OWNER'])(
    'lets %s read the charge and download the receipt, without history or actions',
    async (role) => {
      mocks.session.role = role
      service.getCharge.mockResolvedValue(paidCharge)
      renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)

      expect(await screen.findByRole('button', { name: 'Baixar comprovante.pdf' })).toBeVisible()
      expect(screen.queryByText('Histórico')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Estornar pagamento' })).toBeNull()
      expect(service.getHistory).not.toHaveBeenCalled()
    },
  )

  it('shows a not found state with a way back to the list', async () => {
    service.getCharge.mockRejectedValue(apiError('CHARGE_NOT_FOUND', 404))
    renderWithProviders(<ChargeDetailsPage chargeId="missing" />)

    expect(await screen.findByText('Cobrança não encontrada.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar para Cobranças' }))
    expect(mocks.push).toHaveBeenCalledWith('/dashboard/finance/charges')
  })

  it('offers a retry when loading fails for another reason', async () => {
    service.getCharge.mockRejectedValueOnce(new Error('network')).mockResolvedValue(apiCharge())
    renderWithProviders(<ChargeDetailsPage chargeId="charge-1" />)

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('heading', { name: 'COB-2026-0001' })).toBeVisible()
  })
})
