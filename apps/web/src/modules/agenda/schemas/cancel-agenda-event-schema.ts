import { z } from 'zod'
import type { SchemaMessageTranslator } from '@shared/types'

export function buildCancelAgendaEventSchema(
  t: SchemaMessageTranslator<'reasonRequired' | 'reasonTooLong'>,
) {
  return z.object({
    reason: z.string().trim().min(1, t('reasonRequired')).max(10000, t('reasonTooLong')),
  })
}
