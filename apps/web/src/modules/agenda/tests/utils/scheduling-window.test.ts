import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  computeEarliestSchedulableSlot,
  isWithinBusinessHours,
  meetsMinimumAdvanceNotice,
} from '../../utils/scheduling-window'

describe('meetsMinimumAdvanceNotice', () => {
  const now = dayjs('2026-09-29T09:00:00')

  it('rejeita um horário com menos de 3 horas de antecedência', () => {
    expect(meetsMinimumAdvanceNotice(now.add(2, 'hour'), now)).toBe(false)
  })

  it('aceita um horário com exatamente 3 horas de antecedência', () => {
    expect(meetsMinimumAdvanceNotice(now.add(3, 'hour'), now)).toBe(true)
  })

  it('rejeita um horário no passado', () => {
    expect(meetsMinimumAdvanceNotice(now.subtract(1, 'hour'), now)).toBe(false)
  })
})

describe('isWithinBusinessHours', () => {
  it('aceita horários entre 08:00 e 18:00', () => {
    expect(isWithinBusinessHours(dayjs('2026-09-29T08:00:00'))).toBe(true)
    expect(isWithinBusinessHours(dayjs('2026-09-29T12:30:00'))).toBe(true)
    expect(isWithinBusinessHours(dayjs('2026-09-29T18:00:00'))).toBe(true)
  })

  it('rejeita horários antes das 08:00 ou depois das 18:00', () => {
    expect(isWithinBusinessHours(dayjs('2026-09-29T07:59:00'))).toBe(false)
    expect(isWithinBusinessHours(dayjs('2026-09-29T18:01:00'))).toBe(false)
    expect(isWithinBusinessHours(dayjs('2026-09-29T22:00:00'))).toBe(false)
  })
})

describe('computeEarliestSchedulableSlot', () => {
  it('rounds seconds up without violating the three-hour minimum', () => {
    const now = dayjs('2026-09-29T09:15:30')
    const slot = computeEarliestSchedulableSlot(now)
    expect(slot.format('HH:mm')).toBe('12:30')
    expect(meetsMinimumAdvanceNotice(slot, now)).toBe(true)
  })
  it('soma 3 horas e arredonda para o próximo quarto de hora quando o resultado cai no horário comercial', () => {
    const now = dayjs('2026-09-29T09:10:00')
    const slot = computeEarliestSchedulableSlot(now)

    expect(slot.format('YYYY-MM-DD HH:mm')).toBe('2026-09-29 12:15')
  })

  it('keeps early morning slots available for confirmation', () => {
    const now = dayjs('2026-09-29T03:00:00')
    const slot = computeEarliestSchedulableSlot(now)

    expect(slot.format('YYYY-MM-DD HH:mm')).toBe('2026-09-29 06:00')
  })

  it('keeps evening slots available for confirmation', () => {
    const now = dayjs('2026-09-29T16:30:00')
    const slot = computeEarliestSchedulableSlot(now)

    expect(slot.format('YYYY-MM-DD HH:mm')).toBe('2026-09-29 19:30')
  })
})
