import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createUpdateCurrentUserProfileSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('nameRequired')).max(200, t('nameTooLong')),
    email: z.string().trim().max(254, t('emailTooLong')).email(t('emailInvalid')),
  })
}
