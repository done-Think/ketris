import { describe, expect, it } from 'vitest'

import {
  assertCanDeleteCharge,
  assertCanEditCharge,
  assertCanReversePayment,
  assertCanSettleCharge,
  changedChargeFields,
} from '../../domain/charge-workflow'
import {
  ChargeAlreadySettledError,
  ChargeHasMovementError,
  ChargeLockedError,
  ChargeNotPaidError,
} from '../../domain/errors'
import { storedCharge } from '../fixtures/charge'

describe('changedChargeFields', () => {
  it('só lista o que mudou de verdade', () => {
    const charge = storedCharge()
    expect(
      changedChargeFields(charge, {
        description: charge.description,
        amount: 3000,
        dueDate: new Date(charge.dueDate),
        type: 'A_PAGAR',
      }),
    ).toEqual(['type', 'amount'])
  })
})

describe('assertCanEditCharge', () => {
  it('libera tudo enquanto a cobrança está em aberto', () => {
    expect(() => assertCanEditCharge(storedCharge(), ['amount', 'dueDate'])).not.toThrow()
  })

  it.each(['PAGA', 'CANCELADA'] as const)('%s só aceita mudar a descrição', (storedStatus) => {
    const charge = storedCharge({ storedStatus })
    expect(() => assertCanEditCharge(charge, ['description'])).not.toThrow()
    expect(() => assertCanEditCharge(charge, ['description', 'amount'])).toThrow(ChargeLockedError)
  })
})

describe('assertCanSettleCharge', () => {
  it.each(['PAGA', 'CANCELADA'] as const)(
    'bloqueia pagar ou cancelar quando %s',
    (storedStatus) => {
      expect(() => assertCanSettleCharge(storedCharge({ storedStatus }))).toThrow(
        ChargeAlreadySettledError,
      )
    },
  )
})

describe('assertCanReversePayment', () => {
  it('só estorna cobrança paga', () => {
    expect(() => assertCanReversePayment(storedCharge({ storedStatus: 'PAGA' }))).not.toThrow()
    expect(() => assertCanReversePayment(storedCharge())).toThrow(ChargeNotPaidError)
  })
})

describe('assertCanDeleteCharge', () => {
  it('exclui só em aberto e sem movimento', () => {
    expect(() => assertCanDeleteCharge(storedCharge(), false)).not.toThrow()
    expect(() => assertCanDeleteCharge(storedCharge(), true)).toThrow(ChargeHasMovementError)
    expect(() => assertCanDeleteCharge(storedCharge({ storedStatus: 'PAGA' }), false)).toThrow(
      ChargeHasMovementError,
    )
  })
})
