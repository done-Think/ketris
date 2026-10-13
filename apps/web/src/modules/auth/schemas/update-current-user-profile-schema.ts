import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createUpdateCurrentUserProfileSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('nameRequired')),
    email: z.string().trim().email(t('emailInvalid')),
  })
}

export type UpdateCurrentUserProfileValues = z.infer<
  ReturnType<typeof createUpdateCurrentUserProfileSchema>
>
