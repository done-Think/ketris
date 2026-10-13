import { z } from 'zod'

import { createEmailSchema } from './email-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createCredentialsSchema(t: SchemaMessageTranslator) {
  return z.object({
    email: createEmailSchema(t),
    password: z.string().min(1, t('passwordRequired')),
  })
}
