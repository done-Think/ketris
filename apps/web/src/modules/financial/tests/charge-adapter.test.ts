import { describe, expect, it } from 'vitest'
import {
  buildCreateChargePayload,
  buildRegisterPaymentPayload,
  buildUpdateChargePayload,
  getMonthlyReceivable,
  mapChargeFromApi,
  mapChargeListItemFromApi,
} from '../utils/charge-adapter'
import type { Charge } from '../types/charge'
import type { ApiCharge, ApiChargeListItem } from '../types/service'

const apiChargeListItem: ApiChargeListItem = {
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
}

const apiCharge: ApiCharge = {
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
}

describe('charge-adapter', () => {
  it('maps a list item from the API into the UI charge shape', () => {
    expect(mapChargeListItemFromApi(apiChargeListItem)).toMatchObject({
      id: '0340',
      direction: 'receivable',
      status: 'pending',
      tenant: 'Mariana Souza',
      property: 'Studio Pinheiros',
      competence: '2025-03',
    })
  })

  it('maps a full charge from the API, deriving payment and history', () => {
    const charge = mapChargeFromApi(apiCharge)
    expect(charge).toMatchObject({
      direction: 'payable',
      status: 'paid',
      tenant: 'Energia Paulista',
      receiptReference: 'REC-0333',
      payment: { paymentDate: '2025-03-02', paymentMethod: 'Boleto' },
    })
    expect(charge.history).toEqual([
      { type: 'generated', date: '2025-02-25' },
      { type: 'received', date: '2025-03-02' },
    ])
  })

  it('builds the create payload from form values', () => {
    expect(
      buildCreateChargePayload({
        description: 'Aluguel avulso',
        amount: 1250,
        dueDate: '2025-03-22',
        direction: 'receivable',
        status: 'pending',
      }),
    ).toEqual({
      description: 'Aluguel avulso',
      type: 'A_RECEBER',
      amount: 1250,
      dueDate: '2025-03-22',
      status: 'PENDENTE',
    })
  })

  it('builds the update payload from form values, mapping cancelled to CANCELADA', () => {
    expect(
      buildUpdateChargePayload({
        description: 'Aluguel Studio Pinheiros',
        amount: 2800,
        dueDate: '2025-03-10',
        direction: 'receivable',
        status: 'cancelled',
      }),
    ).toEqual({
      description: 'Aluguel Studio Pinheiros',
      type: 'A_RECEBER',
      amount: 2800,
      dueDate: '2025-03-10',
      status: 'CANCELADA',
    })
  })

  it('builds the register payment payload from form values', () => {
    expect(
      buildRegisterPaymentPayload({ paymentDate: '2025-03-12', paymentMethod: 'Transferência' }),
    ).toEqual({
      paidAt: '2025-03-12',
      paymentMethod: 'Transferência',
      receiptUrl: null,
    })
  })

  it('sums only pending and scheduled receivables for a given competence month', () => {
    const charges: Charge[] = [
      {
        id: '1',
        code: '#COB-1',
        direction: 'receivable',
        description: null,
        tenant: 'A',
        property: 'P',
        amount: 100,
        dueDate: '2025-03-10',
        status: 'pending',
        competence: '2025-03',
        history: [],
      },
      {
        id: '2',
        code: '#COB-2',
        direction: 'receivable',
        description: null,
        tenant: 'B',
        property: 'P',
        amount: 200,
        dueDate: '2025-03-15',
        status: 'scheduled',
        competence: '2025-03',
        history: [],
      },
      {
        id: '3',
        code: '#COB-3',
        direction: 'receivable',
        description: null,
        tenant: 'C',
        property: 'P',
        amount: 300,
        dueDate: '2025-03-20',
        status: 'paid',
        competence: '2025-03',
        history: [],
      },
      {
        id: '4',
        code: '#COB-4',
        direction: 'payable',
        description: null,
        tenant: 'D',
        property: 'P',
        amount: 400,
        dueDate: '2025-03-20',
        status: 'pending',
        competence: '2025-03',
        history: [],
      },
    ]

    expect(getMonthlyReceivable(charges, '2025-03')).toBe(300)
    expect(getMonthlyReceivable(charges, '2025-04')).toBe(0)
  })
})
