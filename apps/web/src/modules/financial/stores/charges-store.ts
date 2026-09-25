'use client'

import { create } from 'zustand'
import { chargeDemoMonth, chargeFixtures } from '../data/charge-fixtures'
import type { Charge, ChargesStoreState } from '../types/charge'

export function getMonthlyReceivable(charges: readonly Charge[], month = chargeDemoMonth) {
  return charges
    .filter(
      (charge) =>
        charge.direction === 'receivable' &&
        charge.competence === month &&
        ['pending', 'scheduled'].includes(charge.status),
    )
    .reduce((total, charge) => total + charge.amount, 0)
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Session-only demo state, following the existing contracts store pattern.
// Removing a charge never decrements the sequence.
export const useChargesStore = create<ChargesStoreState>((set, get) => ({
  charges: [...chargeFixtures],
  nextNumber: Math.max(...chargeFixtures.map((charge) => Number(charge.id))) + 1,
  addCharge: (values) => {
    const number = get().nextNumber
    const id = String(number).padStart(4, '0')
    const charge: Charge = {
      ...values,
      id,
      code: `#COB-${values.dueDate.slice(0, 4)}-${id}`,
      competence: values.dueDate.slice(0, 7),
      history: [{ type: 'generated', date: today() }],
    }
    set((state) => ({ charges: [charge, ...state.charges], nextNumber: number + 1 }))
    return charge
  },
  updateCharge: (id, values) =>
    set((state) => ({
      charges: state.charges.map((charge) => {
        if (charge.id !== id) return charge
        // Payment is recorded through its form; a status edit must not fabricate payment data.
        const status = values.status === 'paid' && !charge.payment ? charge.status : values.status
        const payment = status === 'paid' ? charge.payment : undefined
        return {
          ...charge,
          ...values,
          status,
          competence: values.dueDate.slice(0, 7),
          payment,
          receiptReference: payment ? charge.receiptReference : undefined,
          contact: values.tenant === charge.tenant ? charge.contact : undefined,
          address: values.property === charge.property ? charge.address : undefined,
          contractCode:
            values.tenant === charge.tenant &&
            values.property === charge.property &&
            values.direction === charge.direction
              ? charge.contractCode
              : undefined,
          history: [...charge.history, { type: 'updated' as const, date: today() }],
        }
      }),
    })),
  archiveCharge: (id) =>
    set((state) => ({ charges: state.charges.filter((charge) => charge.id !== id) })),
  registerPayment: (id, payment) =>
    set((state) => ({
      charges: state.charges.map((charge) =>
        charge.id === id && !['paid', 'cancelled'].includes(charge.status)
          ? {
              ...charge,
              status: 'paid',
              payment: { ...payment },
              receiptReference: `REC-${charge.id}`,
              history: [...charge.history, { type: 'received', date: payment.paymentDate }],
            }
          : charge,
      ),
    })),
}))
