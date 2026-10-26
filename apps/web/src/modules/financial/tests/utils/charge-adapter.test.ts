import { describe, expect, it } from 'vitest'

import {
  buildCreateChargePayload,
  buildUpdateChargePayload,
  chargeToFormValues,
  isLockedCharge,
  mapChargeFromApi,
  mapChargeListItemFromApi,
  mapHistoryEventFromApi,
  mapStatusCountsFromApi,
} from '../../utils/charge-adapter'
import { apiCharge, apiListItem, auditEvent } from '../fixtures/charge'

const receipt = {
  id: 'receipt-1',
  name: 'comprovante.pdf',
  contentType: 'application/pdf',
  size: 2048,
  uploadedAt: '2026-10-05T12:00:00.000Z',
}

describe('charge-adapter', () => {
  it('maps a list item, keeping the derived overdue status', () => {
    expect(mapChargeListItemFromApi(apiListItem({ status: 'ATRASADA', type: 'A_PAGAR' }))).toEqual({
      id: 'charge-1',
      code: 'COB-2026-0001',
      contractId: 'contract-1',
      direction: 'payable',
      description: 'Aluguel outubro',
      payer: 'Mariana Souza',
      property: 'Studio Pinheiros',
      amount: 2800,
      dueDate: '2026-10-10',
      status: 'overdue',
    })
  })

  it('falls back to the description when a standalone charge has no payer', () => {
    const row = mapChargeListItemFromApi(
      apiListItem({ contractId: null, payerName: null, propertyTitle: null }),
    )
    expect(row).toMatchObject({ payer: 'Aluguel outubro', property: '', contractId: null })
  })

  it('maps an open charge without payment, cancellation or receipt', () => {
    expect(mapChargeFromApi(apiCharge())).toMatchObject({
      status: 'pending',
      competence: '2026-10',
      open: true,
      payment: null,
      cancellation: null,
      receipt: null,
    })
  })

  it('maps a paid charge with its payment and current receipt', () => {
    const charge = mapChargeFromApi(
      apiCharge({
        status: 'PAGA',
        paidAt: '2026-10-08T00:00:00.000Z',
        paymentMethod: 'PIX',
        receipt,
      }),
    )
    expect(charge).toMatchObject({
      open: false,
      payment: { date: '2026-10-08', method: 'PIX' },
      receipt,
    })
  })

  it('maps a cancelled charge with date and reason', () => {
    const charge = mapChargeFromApi(
      apiCharge({
        status: 'CANCELADA',
        cancelledAt: '2026-10-09T15:00:00.000Z',
        cancellationReason: 'Contrato rescindido',
      }),
    )
    expect(charge.open).toBe(false)
    expect(charge.cancellation).toEqual({
      date: '2026-10-09T15:00:00.000Z',
      reason: 'Contrato rescindido',
    })
  })

  it('maps status counts from the API keys', () => {
    expect(
      mapStatusCountsFromApi({
        ALL: 9,
        PENDENTE: 1,
        ATRASADA: 2,
        PAGA: 3,
        AGENDADA: 2,
        CANCELADA: 1,
      }),
    ).toEqual({ all: 9, pending: 1, overdue: 2, paid: 3, scheduled: 2, cancelled: 1 })
  })

  it('maps a history event', () => {
    expect(
      mapHistoryEventFromApi(
        auditEvent({ action: 'PAYMENT_REVERSED', reason: 'Pix devolvido', receipt }),
      ),
    ).toEqual({
      id: 'event-1',
      action: 'PAYMENT_REVERSED',
      actorName: 'Ana Dona',
      date: '2026-10-01T12:00:00.000Z',
      reason: 'Pix devolvido',
      changedFields: [],
      receipt,
    })
  })

  it('builds the create payload with API enums and a trimmed description', () => {
    expect(
      buildCreateChargePayload({
        description: '  Taxa extra  ',
        amount: 150,
        dueDate: '2026-11-05',
        direction: 'payable',
        status: 'scheduled',
      }),
    ).toEqual({
      description: 'Taxa extra',
      type: 'A_PAGAR',
      amount: 150,
      dueDate: '2026-11-05',
      status: 'AGENDADA',
    })
  })

  it('never sends a status when editing', () => {
    const row = mapChargeListItemFromApi(apiListItem())
    const payload = buildUpdateChargePayload(row, {
      description: '',
      amount: 3000,
      dueDate: '2026-10-15',
      direction: 'receivable',
      status: 'scheduled',
    })
    expect(payload).toEqual({
      description: null,
      type: 'A_RECEBER',
      amount: 3000,
      dueDate: '2026-10-15',
    })
  })

  it('only sends the description when editing a paid or cancelled charge', () => {
    for (const status of ['PAGA', 'CANCELADA'] as const) {
      const row = mapChargeListItemFromApi(apiListItem({ status }))
      expect(isLockedCharge(row)).toBe(true)
      expect(
        buildUpdateChargePayload(row, {
          description: 'Nova descrição',
          amount: 1,
          dueDate: '2027-01-01',
          direction: 'payable',
          status: 'pending',
        }),
      ).toEqual({ description: 'Nova descrição' })
    }
  })

  it('treats pending, scheduled and overdue charges as open', () => {
    for (const status of ['pending', 'scheduled', 'overdue'] as const) {
      expect(isLockedCharge({ status })).toBe(false)
    }
  })

  it('prefills the form from a charge or with empty defaults', () => {
    expect(chargeToFormValues(null)).toEqual({
      description: '',
      amount: 0,
      dueDate: '',
      direction: 'receivable',
      status: 'pending',
    })
    expect(
      chargeToFormValues(mapChargeListItemFromApi(apiListItem({ status: 'AGENDADA' }))),
    ).toEqual({
      description: 'Aluguel outubro',
      amount: 2800,
      dueDate: '2026-10-10',
      direction: 'receivable',
      status: 'scheduled',
    })
  })
})
