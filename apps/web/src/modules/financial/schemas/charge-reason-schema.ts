import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createChargeReasonSchema(
  t: SchemaMessageTranslator<'reasonRequired' | 'reasonTooLong'>,
) {
  return z.object({
    reason: z.string().trim().min(3, t('reasonRequired')).max(500, t('reasonTooLong')),
  })
}
