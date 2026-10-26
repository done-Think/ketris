import { describe, expect, it } from 'vitest'

import { effectiveChargeStatus, isOpenChargeStatus } from '../../domain/charge-status'

const today = new Date('2026-10-26T00:00:00.000Z')
const yesterday = new Date('2026-10-25T00:00:00.000Z')

describe('effectiveChargeStatus', () => {
  it.each(['PENDENTE', 'AGENDADA'] as const)('%s vencida vira ATRASADA', (status) => {
    expect(effectiveChargeStatus(status, yesterday, today)).toBe('ATRASADA')
  })

  it.each(['PENDENTE', 'AGENDADA'] as const)(
    '%s que vence hoje ainda não está atrasada',
    (status) => {
      expect(effectiveChargeStatus(status, today, today)).toBe(status)
    },
  )

  it.each(['PAGA', 'CANCELADA'] as const)('%s vencida continua %s', (status) => {
    expect(effectiveChargeStatus(status, yesterday, today)).toBe(status)
  })
})

describe('isOpenChargeStatus', () => {
  it('só pendente e agendada estão em aberto', () => {
    expect(isOpenChargeStatus('PENDENTE')).toBe(true)
    expect(isOpenChargeStatus('AGENDADA')).toBe(true)
    expect(isOpenChargeStatus('PAGA')).toBe(false)
    expect(isOpenChargeStatus('CANCELADA')).toBe(false)
  })
})
