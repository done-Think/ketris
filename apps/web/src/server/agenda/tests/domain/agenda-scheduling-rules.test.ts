import { describe, expect, it } from 'vitest'

import { assertWithinAgendaSchedulingWindow } from '../../domain/agenda-scheduling-rules'
import {
  AgendaMinimumAdvanceNoticeError,
  AgendaOutsideBusinessHoursError,
} from '../../domain/errors'

const now = new Date('2026-09-29T12:00:00.000Z')

describe('assertWithinAgendaSchedulingWindow', () => {
  it('aceita um horário com pelo menos 3 horas de antecedência dentro do horário comercial', () => {
    expect(() =>
      assertWithinAgendaSchedulingWindow(new Date('2026-09-29T18:00:00.000Z'), now),
    ).not.toThrow()
  })

  it('lança AgendaMinimumAdvanceNoticeError quando falta menos de 3 horas', () => {
    expect(() =>
      assertWithinAgendaSchedulingWindow(new Date('2026-09-29T14:00:00.000Z'), now),
    ).toThrow(AgendaMinimumAdvanceNoticeError)
  })

  it('lança AgendaMinimumAdvanceNoticeError para um horário no passado', () => {
    expect(() =>
      assertWithinAgendaSchedulingWindow(new Date('2026-09-28T12:00:00.000Z'), now),
    ).toThrow(AgendaMinimumAdvanceNoticeError)
  })

  it('lança AgendaOutsideBusinessHoursError antes das 08:00 (horário de Brasília)', () => {
    expect(() =>
      assertWithinAgendaSchedulingWindow(new Date('2026-09-30T10:00:00.000Z'), now),
    ).toThrow(AgendaOutsideBusinessHoursError)
  })

  it('lança AgendaOutsideBusinessHoursError depois das 18:00 (horário de Brasília)', () => {
    expect(() =>
      assertWithinAgendaSchedulingWindow(new Date('2026-09-29T22:00:00.000Z'), now),
    ).toThrow(AgendaOutsideBusinessHoursError)
  })

  it('aceita exatamente às 08:00 e às 18:00 no horário de Brasília', () => {
    expect(() =>
      assertWithinAgendaSchedulingWindow(new Date('2026-09-30T11:00:00.000Z'), now),
    ).not.toThrow()
    expect(() =>
      assertWithinAgendaSchedulingWindow(new Date('2026-09-29T21:00:00.000Z'), now),
    ).not.toThrow()
  })
})
