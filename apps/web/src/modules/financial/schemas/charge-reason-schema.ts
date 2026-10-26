import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createChargeReasonSchema(t: SchemaMessageTranslator) {
  return z.object({
    reason: z.string().trim().min(3, t('reasonRequired')).max(500, t('reasonTooLong')),
  })
}
