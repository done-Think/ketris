import { describe, expect, it } from 'vitest'

import { buildRecordAgendaEventOutcomeSchema } from '../../schemas/record-agenda-event-outcome-schema'

const t = (key: string) => key

describe('buildRecordAgendaEventOutcomeSchema', () => {
  it('exige o interesse em visita realizada', () => {
    const result = buildRecordAgendaEventOutcomeSchema(t, 'VISIT').safeParse({
      outcome: 'COMPLETED',
      visitInterest: null,
      notes: '',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({
      path: ['visitInterest'],
      message: 'visitInterestRequired',
    })
  })

  it('não exige interesse quando o cliente faltou ou o evento não é visita', () => {
    expect(
      buildRecordAgendaEventOutcomeSchema(t, 'VISIT').safeParse({
        outcome: 'NO_SHOW',
        visitInterest: null,
        notes: '',
      }).success,
    ).toBe(true)
    expect(
      buildRecordAgendaEventOutcomeSchema(t, 'MEETING').safeParse({
        outcome: 'COMPLETED',
        visitInterest: null,
        notes: '',
      }).success,
    ).toBe(true)
  })

  it('limita o tamanho das anotações', () => {
    const result = buildRecordAgendaEventOutcomeSchema(t, 'MEETING').safeParse({
      outcome: 'COMPLETED',
      visitInterest: null,
      notes: 'x'.repeat(10001),
    })

    expect(result.error?.issues[0]?.message).toBe('notesTooLong')
  })
})
