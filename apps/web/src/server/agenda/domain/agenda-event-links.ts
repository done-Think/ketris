import { normalizeEmail } from '@server/shared/normalize-email'

import type { AgendaEventLinks } from '../types/agenda-event'

export function normalizeAgendaEventLinks(links: AgendaEventLinks): AgendaEventLinks {
  return {
    donoEmail:
      links.donoEmail === undefined || links.donoEmail === null
        ? links.donoEmail
        : normalizeEmail(links.donoEmail),
    participanteEmails:
      links.participanteEmails === undefined
        ? undefined
        : [...new Set(links.participanteEmails.map(normalizeEmail))],
  }
}
