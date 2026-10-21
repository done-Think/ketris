import { describe, expect, it } from 'vitest'

import { normalizeAgendaEventLinks } from '../../domain/agenda-event-links'

describe('normalizeAgendaEventLinks', () => {
  it('normaliza e remove e-mails duplicados de participantes', () => {
    expect(
      normalizeAgendaEventLinks({
        donoEmail: '  Ana@Ketris.Dev ',
        participanteEmails: ['B@ketris.dev', 'b@ketris.dev ', 'c@ketris.dev'],
      }),
    ).toEqual({
      donoEmail: 'ana@ketris.dev',
      participanteEmails: ['b@ketris.dev', 'c@ketris.dev'],
    })
  })

  it('preserva a semântica de edição: omitido mantém, null remove dono, [] remove participantes', () => {
    expect(normalizeAgendaEventLinks({})).toEqual({
      donoEmail: undefined,
      participanteEmails: undefined,
    })
    expect(normalizeAgendaEventLinks({ donoEmail: null, participanteEmails: [] })).toEqual({
      donoEmail: null,
      participanteEmails: [],
    })
  })
})
