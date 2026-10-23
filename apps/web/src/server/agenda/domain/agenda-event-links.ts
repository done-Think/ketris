import { normalizeEmail } from '@server/shared/normalize-email'

import type { AgendaEventLinks } from './agenda-event.entity'

/**
 * Normalizes and de-duplicates the link e-mails while preserving the edit semantics:
 * undefined stays undefined (keep), null stays null (remove owner) and [] stays [] (remove all).
 */
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
