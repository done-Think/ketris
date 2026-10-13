import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createUpdateAdminSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().min(1, t('nameRequired')),
    email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
  })
}
