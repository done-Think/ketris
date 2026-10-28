import { describe, expect, it } from 'vitest'

import { normalizeAgendaEventLinks } from '../../domain/agenda-event-links'

describe('normalizeAgendaEventLinks', () => {
  it('normaliza e remove e-mails duplicados de participantes', () => {
    expect(
      normalizeAgendaEventLinks({
        ownerEmail: '  Ana@Ketris.Dev ',
        participantEmails: ['B@ketris.dev', 'b@ketris.dev ', 'c@ketris.dev'],
      }),
    ).toEqual({
      ownerEmail: 'ana@ketris.dev',
      participantEmails: ['b@ketris.dev', 'c@ketris.dev'],
    })
  })

  it('preserva a semântica de edição: omitido mantém, null remove dono, [] remove participantes', () => {
    expect(normalizeAgendaEventLinks({})).toEqual({
      ownerEmail: undefined,
      participantEmails: undefined,
    })
    expect(normalizeAgendaEventLinks({ ownerEmail: null, participantEmails: [] })).toEqual({
      ownerEmail: null,
      participantEmails: [],
    })
  })
})
