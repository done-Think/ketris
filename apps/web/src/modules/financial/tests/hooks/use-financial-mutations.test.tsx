import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { financialQueryKeys } from '../../config/financial-query-keys'
import {
  useCharge,
  useChargeHistory,
  useExportCharges,
  useRegisterChargePayment,
  useUpdateCharge,
} from '../../hooks/use-financial'
import { financialService } from '../../services/financial-service'
import { mapChargeListItemFromApi } from '../../utils/charge-adapter'
import { apiCharge, apiListItem, auditEvent } from '../fixtures/charge'
import { createTestQueryClient } from '../fixtures/render'

const session = vi.hoisted(() => ({
  user: { id: 'owner' },
  tenantId: 'tenant',
  role: 'OWNER',
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: session, status: 'authenticated' }),
}))
vi.mock('../../services/financial-service', () => ({
  financialService: {
    getCharge: vi.fn(),
    getHistory: vi.fn(),
    updateCharge: vi.fn(),
    uploadReceipt: vi.fn(),
    registerPayment: vi.fn(),
    exportCharges: vi.fn(),
  },
}))

let client: ReturnType<typeof createTestQueryClient>
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.resetAllMocks()
  session.role = 'OWNER'
  client = createTestQueryClient()
})
afterEach(() => vi.unstubAllGlobals())

const receiptFile = () => new File(['%PDF'], 'comprovante.pdf', { type: 'application/pdf' })

describe('financial mutations', () => {
  it('uploads the receipt before registering the payment with its token', async () => {
    vi.mocked(financialService.uploadReceipt).mockResolvedValue('upload-token')
    vi.mocked(financialService.registerPayment).mockResolvedValue(apiCharge({ status: 'PAID' }))
    const { result } = renderHook(() => useRegisterChargePayment(), { wrapper })

    await act(() =>
      result.current.mutateAsync({
        chargeId: 'charge-1',
        values: { paymentDate: '2026-10-08', paymentMethod: ' PIX ', receipt: receiptFile() },
      }),
    )

    expect(financialService.uploadReceipt).toHaveBeenCalledWith('charge-1', expect.any(File))
    expect(financialService.registerPayment).toHaveBeenCalledWith('charge-1', {
      paidAt: '2026-10-08',
      paymentMethod: 'PIX',
      receiptUploadToken: 'upload-token',
    })
  })

  it('registers the payment without uploading when there is no receipt', async () => {
    vi.mocked(financialService.registerPayment).mockResolvedValue(apiCharge({ status: 'PAID' }))
    const { result } = renderHook(() => useRegisterChargePayment(), { wrapper })

    await act(() =>
      result.current.mutateAsync({
        chargeId: 'charge-1',
        values: { paymentDate: '2026-10-08', paymentMethod: 'Boleto', receipt: null },
      }),
    )

    expect(financialService.uploadReceipt).not.toHaveBeenCalled()
    expect(financialService.registerPayment).toHaveBeenCalledWith('charge-1', {
      paidAt: '2026-10-08',
      paymentMethod: 'Boleto',
    })
  })

  it('does not register the payment when the receipt upload fails', async () => {
    vi.mocked(financialService.uploadReceipt).mockRejectedValue(new Error('storage'))
    const { result } = renderHook(() => useRegisterChargePayment(), { wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          chargeId: 'charge-1',
          values: { paymentDate: '2026-10-08', paymentMethod: 'PIX', receipt: receiptFile() },
        }),
      ).rejects.toThrow('storage')
    })
    expect(financialService.registerPayment).not.toHaveBeenCalled()
  })

  it('updates the cached detail and invalidates financial and dashboard queries', async () => {
    const updated = apiCharge({ description: 'Atualizada' })
    vi.mocked(financialService.getCharge)
      .mockResolvedValueOnce(apiCharge())
      .mockResolvedValue(updated)
    vi.mocked(financialService.updateCharge).mockResolvedValue(updated)
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(
      () => ({ detail: useCharge('charge-1'), update: useUpdateCharge() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.detail.data?.description).toBe('Aluguel outubro'))

    await act(() =>
      result.current.update.mutateAsync({
        charge: mapChargeListItemFromApi(apiListItem()),
        values: {
          description: 'Atualizada',
          amount: 2800,
          dueDate: '2026-10-10',
          direction: 'receivable',
          status: 'pending',
        },
      }),
    )

    await waitFor(() => expect(result.current.detail.data?.description).toBe('Atualizada'))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: financialQueryKeys.tenant('tenant') })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard', 'tenant'] })
  })

  it('loads the history only for the OWNER', async () => {
    vi.mocked(financialService.getHistory).mockResolvedValue({
      events: [auditEvent({ action: 'UPDATED', changedFields: ['amount'] })],
    })
    const owner = renderHook(() => useChargeHistory('charge-1'), { wrapper })
    await waitFor(() => expect(owner.result.current.data?.[0].changedFields).toEqual(['amount']))

    session.role = 'PROPERTY_OWNER'
    client = createTestQueryClient()
    const propertyOwner = renderHook(() => useChargeHistory('charge-1'), { wrapper })
    expect(propertyOwner.result.current.fetchStatus).toBe('idle')
    expect(financialService.getHistory).toHaveBeenCalledTimes(1)
  })

  it('downloads the exported CSV with the month in the file name', async () => {
    const blob = new Blob(['csv'], { type: 'text/csv' })
    vi.mocked(financialService.exportCharges).mockResolvedValue(blob)
    const createObjectURL = vi.fn(() => 'blob:csv')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { result } = renderHook(() => useExportCharges(), { wrapper })

    await act(() => result.current.mutateAsync({ month: '2026-10', locale: 'pt-BR' }))

    expect(financialService.exportCharges).toHaveBeenCalledWith('2026-10', 'pt-BR')
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('cobrancas-2026-10.csv')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv')
    click.mockRestore()
  })
})
