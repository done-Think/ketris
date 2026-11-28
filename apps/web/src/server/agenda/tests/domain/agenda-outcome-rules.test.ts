import { describe, expect, it } from 'vitest'

import type { AgendaEvent } from '../../domain/agenda-event.entity'
import {
  assertAgendaEventOpen,
  assertAgendaOutcomeAllowed,
  assertCanRecordAgendaOutcome,
} from '../../domain/agenda-outcome-rules'

const now = new Date('2026-11-04T15:00:00.000Z')

const event = (overrides: Partial<AgendaEvent> = {}) =>
  ({
    responsibleId: 'agent-1',
    createdById: 'agent-1',
    audience: 'SHARED_TEAM',
    internal: false,
    type: 'VISIT',
    status: 'CONFIRMED',
    start: new Date('2026-11-04T13:30:00.000Z'),
    ...overrides,
  }) as AgendaEvent

describe('assertAgendaEventOpen', () => {
  it.each(['CONFIRMED', 'PENDING', 'RESCHEDULE', 'CANCELLED'] as const)(
    'aceita evento com status %s',
    (status) => {
      expect(() => assertAgendaEventOpen({ status })).not.toThrow()
    },
  )

  it.each(['COMPLETED', 'NO_SHOW'] as const)('recusa evento com resultado %s', (status) => {
    expect(() => assertAgendaEventOpen({ status })).toThrow(
      expect.objectContaining({ status: 409, code: 'AGENDA_EVENT_CLOSED' }),
    )
  })
})

describe('assertCanRecordAgendaOutcome', () => {
  it('o corretor responsável registra o resultado do evento aberto', () => {
    expect(() =>
      assertCanRecordAgendaOutcome('AGENT', 'agent-1', event({ audience: 'ASSIGNED_AGENT' })),
    ).not.toThrow()
  })

  it.each(['RENTER', 'PROPERTY_OWNER'] as const)(
    '%s não registra resultado, nem do evento que criou',
    (role) => {
      expect(() =>
        assertCanRecordAgendaOutcome(role, 'user-1', event({ createdById: 'user-1' })),
      ).toThrow(expect.objectContaining({ status: 403, code: 'FORBIDDEN' }))
    },
  )

  it('o corretor não registra resultado de evento direcionado a outro corretor', () => {
    expect(() =>
      assertCanRecordAgendaOutcome('AGENT', 'agent-2', event({ audience: 'ASSIGNED_AGENT' })),
    ).toThrow(expect.objectContaining({ code: 'FORBIDDEN' }))
  })

  it('o corretor não altera um resultado já registrado', () => {
    expect(() =>
      assertCanRecordAgendaOutcome('AGENT', 'agent-1', event({ status: 'COMPLETED' })),
    ).toThrow(expect.objectContaining({ code: 'AGENDA_EVENT_CLOSED' }))
  })

  it('o OWNER corrige um resultado já registrado', () => {
    expect(() =>
      assertCanRecordAgendaOutcome('OWNER', 'owner-1', event({ status: 'NO_SHOW' })),
    ).not.toThrow()
  })
})

describe('assertAgendaOutcomeAllowed', () => {
  it('aceita visita realizada com interesse informado', () => {
    expect(() => assertAgendaOutcomeAllowed(event(), 'COMPLETED', 'HIGH', now)).not.toThrow()
  })

  it('aceita o registro exatamente no início do evento', () => {
    expect(() =>
      assertAgendaOutcomeAllowed(event({ start: now }), 'COMPLETED', 'LOW', now),
    ).not.toThrow()
  })

  it('recusa evento que ainda não começou', () => {
    expect(() =>
      assertAgendaOutcomeAllowed(
        event({ start: new Date(now.getTime() + 60_000) }),
        'COMPLETED',
        'HIGH',
        now,
      ),
    ).toThrow(expect.objectContaining({ status: 409, code: 'AGENDA_OUTCOME_BEFORE_START' }))
  })

  it('recusa evento cancelado', () => {
    expect(() =>
      assertAgendaOutcomeAllowed(event({ status: 'CANCELLED' }), 'COMPLETED', 'HIGH', now),
    ).toThrow(expect.objectContaining({ status: 409, code: 'AGENDA_OUTCOME_CANCELLED_EVENT' }))
  })

  it('exige o interesse do cliente em visita realizada', () => {
    expect(() => assertAgendaOutcomeAllowed(event(), 'COMPLETED', undefined, now)).toThrow(
      expect.objectContaining({ status: 400, code: 'AGENDA_VISIT_INTEREST_REQUIRED' }),
    )
  })

  it('aceita reunião realizada sem interesse e recusa interesse fora de visita', () => {
    expect(() =>
      assertAgendaOutcomeAllowed(event({ type: 'MEETING' }), 'COMPLETED', undefined, now),
    ).not.toThrow()
    expect(() =>
      assertAgendaOutcomeAllowed(event({ type: 'MEETING' }), 'COMPLETED', 'LOW', now),
    ).toThrow(expect.objectContaining({ code: 'AGENDA_VISIT_INTEREST_NOT_ALLOWED' }))
  })

  it('recusa interesse quando o cliente não compareceu', () => {
    expect(() => assertAgendaOutcomeAllowed(event(), 'NO_SHOW', 'LOW', now)).toThrow(
      expect.objectContaining({ code: 'AGENDA_VISIT_INTEREST_NOT_ALLOWED' }),
    )
    expect(() => assertAgendaOutcomeAllowed(event(), 'NO_SHOW', undefined, now)).not.toThrow()
  })

  it('recusa ausência de cliente em evento interno', () => {
    expect(() =>
      assertAgendaOutcomeAllowed(
        event({ internal: true, type: 'MEETING' }),
        'NO_SHOW',
        undefined,
        now,
      ),
    ).toThrow(expect.objectContaining({ status: 400, code: 'AGENDA_NO_SHOW_INTERNAL_EVENT' }))
  })
})
