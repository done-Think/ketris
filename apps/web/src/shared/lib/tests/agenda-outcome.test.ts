import { describe, expect, it } from 'vitest'

import {
  hasAgendaEventStarted,
  isAgendaOutcomeStatus,
  requiresAgendaVisitInterest,
} from '@shared/lib/utils/agenda-outcome'

describe('agenda-outcome', () => {
  it.each([
    ['COMPLETED', true],
    ['NO_SHOW', true],
    ['CONFIRMED', false],
    ['CANCELLED', false],
  ])('isAgendaOutcomeStatus(%s) = %s', (status, expected) => {
    expect(isAgendaOutcomeStatus(status)).toBe(expected)
  })

  it('considera o evento iniciado a partir do horário de início', () => {
    const start = new Date('2026-11-04T13:30:00.000Z')

    expect(hasAgendaEventStarted(start, new Date('2026-11-04T13:29:59.999Z'))).toBe(false)
    expect(hasAgendaEventStarted(start, start)).toBe(true)
  })

  it('exige interesse só em visita realizada', () => {
    expect(requiresAgendaVisitInterest('COMPLETED', 'VISIT')).toBe(true)
    expect(requiresAgendaVisitInterest('NO_SHOW', 'VISIT')).toBe(false)
    expect(requiresAgendaVisitInterest('COMPLETED', 'MEETING')).toBe(false)
    expect(requiresAgendaVisitInterest('COMPLETED', null)).toBe(false)
  })
})
