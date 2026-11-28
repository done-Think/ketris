import { z } from 'zod'
import type { SchemaMessageTranslator } from '@shared/types'
import {
  AGENDA_EVENT_OUTCOMES,
  AGENDA_OUTCOME_NOTES_MAX_LENGTH,
  AGENDA_VISIT_INTERESTS,
  requiresAgendaVisitInterest,
} from '@shared/lib/utils/agenda-outcome'

export function buildRecordAgendaEventOutcomeSchema(
  t: SchemaMessageTranslator<'visitInterestRequired' | 'notesTooLong'>,
  kind: string | null | undefined,
) {
  return z
    .object({
      outcome: z.enum(AGENDA_EVENT_OUTCOMES),
      visitInterest: z.enum(AGENDA_VISIT_INTERESTS).nullable(),
      notes: z.string().trim().max(AGENDA_OUTCOME_NOTES_MAX_LENGTH, t('notesTooLong')),
    })
    .superRefine((values, context) => {
      if (requiresAgendaVisitInterest(values.outcome, kind) && !values.visitInterest) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['visitInterest'],
          message: t('visitInterestRequired'),
        })
      }
    })
}
