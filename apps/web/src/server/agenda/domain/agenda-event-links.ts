import { normalizeEmail } from '@server/shared/normalize-email'

import type { AgendaEventLinks } from '../types/agenda-event'

export function normalizeAgendaEventLinks(links: AgendaEventLinks): AgendaEventLinks {
  return {
    ownerEmail:
      links.ownerEmail === undefined || links.ownerEmail === null
        ? links.ownerEmail
        : normalizeEmail(links.ownerEmail),
    participantEmails:
      links.participantEmails === undefined
        ? undefined
        : [...new Set(links.participantEmails.map(normalizeEmail))],
  }
}
