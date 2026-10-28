// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { FinancialService } from '../../services/financial-service'
import { apiCharge } from '../fixtures/charge'

function mockClient() {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }
}

let api: ReturnType<typeof mockClient>
let storage: ReturnType<typeof mockClient>
let service: FinancialService

beforeEach(() => {
  api = mockClient()
  storage = mockClient()
  service = new FinancialService(api as unknown as HttpClient, storage as unknown as HttpClient)
})

describe('FinancialService', () => {
  it('lists charges sending only the filled filters', async () => {
    api.get.mockResolvedValue({ items: [], totalCount: 0 })
    await service.listCharges({ type: 'RECEIVABLE', search: '', page: 2, dueMonth: '2026-10' })
    expect(api.get).toHaveBeenCalledWith('/financial/charges', {
      params: { type: 'RECEIVABLE', page: '2', dueMonth: '2026-10' },
    })
  })

  it('unwraps the charge from detail and mutation responses', async () => {
    const charge = apiCharge()
    api.get.mockResolvedValue({ charge })
    api.post.mockResolvedValue({ charge })
    api.patch.mockResolvedValue({ charge })

    await expect(service.getCharge('charge-1')).resolves.toBe(charge)
    await expect(service.updateCharge('charge-1', { description: 'Nova' })).resolves.toBe(charge)
    await expect(service.cancelCharge('charge-1', { reason: 'Rescisão' })).resolves.toBe(charge)
    await expect(service.reversePayment('charge-1', { reason: 'Pix devolvido' })).resolves.toBe(
      charge,
    )
    expect(api.patch).toHaveBeenCalledWith('/financial/charges/charge-1', { description: 'Nova' })
    expect(api.post).toHaveBeenCalledWith('/financial/charges/charge-1/cancel', {
      reason: 'Rescisão',
    })
    expect(api.post).toHaveBeenCalledWith('/financial/charges/charge-1/payment-reversal', {
      reason: 'Pix devolvido',
    })
  })

  it('uploads the receipt straight to storage and returns the upload token', async () => {
    api.post.mockResolvedValue({
      uploadUrl: 'https://s3.example.com/receipt',
      headers: { 'Content-Type': 'application/pdf' },
      uploadToken: 'token-1',
      expiresAt: '2026-10-26T12:00:00.000Z',
    })
    const file = new File(['abc'], 'comprovante.pdf', { type: 'application/pdf' })

    await expect(service.uploadReceipt('charge-1', file)).resolves.toBe('token-1')
    expect(api.post).toHaveBeenCalledWith('/financial/charges/charge-1/receipt-uploads', {
      name: 'comprovante.pdf',
      contentType: 'application/pdf',
      size: 3,
      sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    })
    expect(storage.put).toHaveBeenCalledWith('https://s3.example.com/receipt', file, {
      headers: { 'Content-Type': 'application/pdf' },
      timeout: 120000,
      withCredentials: false,
      skipUnauthorizedHandling: true,
    })
  })

  it('does not register anything when the storage upload fails', async () => {
    api.post.mockResolvedValue({ uploadUrl: 'u', headers: {}, uploadToken: 't', expiresAt: '' })
    storage.put.mockRejectedValue(new Error('network'))
    await expect(
      service.uploadReceipt('charge-1', new File(['x'], 'a.pdf', { type: 'application/pdf' })),
    ).rejects.toThrow('network')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('calls the payment, history, download, export and summary endpoints', async () => {
    api.post.mockResolvedValue({ charge: apiCharge() })
    api.get.mockResolvedValue({})

    await service.registerPayment('charge-1', { paidAt: '2026-10-08', paymentMethod: 'PIX' })
    await service.getHistory('charge-1')
    await service.downloadReceipt('charge-1', 'receipt-1')
    await service.exportCharges('2026-10', 'pt-BR')
    await service.getSummary('2026-10')
    await service.getSummary()

    expect(api.post).toHaveBeenCalledWith('/financial/charges/charge-1/payment', {
      paidAt: '2026-10-08',
      paymentMethod: 'PIX',
    })
    expect(api.get.mock.calls).toEqual([
      ['/financial/charges/charge-1/history'],
      ['/financial/charges/charge-1/receipts/receipt-1/download'],
      [
        '/financial/charges/export',
        { params: { month: '2026-10', locale: 'pt-BR' }, responseType: 'blob' },
      ],
      ['/financial/summary', { params: { month: '2026-10' } }],
      ['/financial/summary', { params: undefined }],
    ])
  })

  it('deletes a charge', async () => {
    api.delete.mockResolvedValue(undefined)
    await service.deleteCharge('charge-1')
    expect(api.delete).toHaveBeenCalledWith('/financial/charges/charge-1')
  })
})
