import { z } from 'zod'

import { createEmailSchema, type SchemaMessageTranslator } from './email-schema'

export function createCredentialsSchema(t: SchemaMessageTranslator) {
  return z.object({
    email: createEmailSchema(t),
    password: z.string().min(1, t('passwordRequired')),
  })
}

export type CredentialsFormValues = z.infer<ReturnType<typeof createCredentialsSchema>>
