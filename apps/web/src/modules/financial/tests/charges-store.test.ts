import { beforeEach, describe, expect, it } from 'vitest'
import { chargeFixtures } from '../data/charge-fixtures'
import { getMonthlyReceivable, useChargesStore } from '../stores/charges-store'
import { createChargeSchema } from '../schemas/create-charge-schema'
import { registerPaymentSchema } from '../schemas/register-payment-schema'
import type { CreateChargeFormValues } from '../types/charge'

const values: CreateChargeFormValues = {
  tenant: 'Demo tenant',
  property: 'Demo property',
  amount: 100,
  dueDate: '2025-03-10',
  direction: 'receivable',
  status: 'pending',
}
beforeEach(() => useChargesStore.setState(useChargesStore.getInitialState(), true))

describe('charges demo state', () => {
  it('never reuses identities after create, archive and create', () => {
    const first = useChargesStore.getState().addCharge(values)
    useChargesStore.getState().archiveCharge(first.id)
    const second = useChargesStore.getState().addCharge(values)
    expect(second.id).not.toBe(first.id)
    expect(second.code).not.toBe(first.code)
    expect(
      useChargesStore.getState().charges.find((charge) => charge.id === first.id),
    ).toBeUndefined()
  })
  it('updates without changing identity or retaining unrelated contact details', () => {
    const original = chargeFixtures[1]
    useChargesStore.getState().updateCharge(original.id, {
      ...original,
      tenant: 'Other tenant',
      property: 'Other property',
      dueDate: '2025-04-10',
    })
    const updated = useChargesStore.getState().charges.find((charge) => charge.id === original.id)!
    expect(updated).toMatchObject({
      code: original.code,
      competence: '2025-04',
      tenant: 'Other tenant',
    })
    expect(updated.contact).toBeUndefined()
    expect(updated.address).toBeUndefined()
    expect(updated.contractCode).toBeUndefined()
  })
  it('preserves payment input and records exactly one payment event', () => {
    const payment = { paymentDate: '2025-03-12', paymentMethod: 'Transferência' }
    useChargesStore.getState().registerPayment('0340', payment)
    useChargesStore.getState().registerPayment('0340', payment)
    const charge = useChargesStore.getState().charges.find((item) => item.id === '0340')!
    expect(charge).toMatchObject({
      status: 'paid',
      amount: 2800,
      payment,
      receiptReference: 'REC-0340',
    })
    expect(charge.history.filter((event) => event.type === 'received')).toEqual([
      { type: 'received', date: payment.paymentDate },
    ])
  })
  it('does not fabricate payments through editing or pay cancelled charges', () => {
    const charge = chargeFixtures[1]
    useChargesStore.getState().updateCharge(charge.id, { ...charge, status: 'paid' })
    expect(useChargesStore.getState().charges.find((item) => item.id === charge.id)?.status).toBe(
      'pending',
    )
    useChargesStore
      .getState()
      .registerPayment('0336', { paymentDate: '2025-03-12', paymentMethod: 'PIX' })
    expect(useChargesStore.getState().charges.find((item) => item.id === '0336')?.status).toBe(
      'cancelled',
    )
  })
  it('only sums pending and scheduled receivables in the demo competence', () => {
    expect(getMonthlyReceivable(chargeFixtures)).toBe(9500)
    useChargesStore.getState().addCharge({ ...values, dueDate: '2025-04-10' })
    expect(getMonthlyReceivable(useChargesStore.getState().charges)).toBe(9500)
    expect(getMonthlyReceivable(useChargesStore.getState().charges, '2025-04')).toBe(100)
    useChargesStore
      .getState()
      .registerPayment('0340', { paymentDate: '2025-03-12', paymentMethod: 'PIX' })
    expect(getMonthlyReceivable(useChargesStore.getState().charges)).toBe(6700)
  })
  it('starts with coherent paid fixtures and distinct linked data', () => {
    for (const charge of chargeFixtures) {
      expect(charge.contact).toBeTruthy()
      if (charge.status === 'paid') {
        expect(charge.payment?.paymentDate).toBeTruthy()
        expect(charge.payment?.paymentMethod).toBeTruthy()
        expect(charge.receiptReference).toBeTruthy()
        expect(charge.history.some((event) => event.type === 'received')).toBe(true)
      } else expect(charge.receiptReference).toBeUndefined()
    }
    expect(new Set(chargeFixtures.map((charge) => charge.contact)).size).toBe(chargeFixtures.length)
  })
  it('validates required form fields, positive amounts and real calendar dates', () => {
    expect(createChargeSchema.safeParse(values).success).toBe(true)
    expect(createChargeSchema.safeParse({ ...values, amount: 0 }).success).toBe(false)
    expect(createChargeSchema.safeParse({ ...values, tenant: ' ' }).success).toBe(false)
    expect(createChargeSchema.safeParse({ ...values, dueDate: '2025-02-30' }).success).toBe(false)
    expect(registerPaymentSchema.safeParse({ paymentDate: '', paymentMethod: '' }).success).toBe(
      false,
    )
  })
})
