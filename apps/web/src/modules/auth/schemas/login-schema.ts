export { createEmailSchema } from '@shared/schemas/email-schema'
import { z } from 'zod'
import { createCredentialsSchema } from '@shared/schemas/credentials-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createLoginSchema(t: SchemaMessageTranslator) {
  return createCredentialsSchema(t).extend({
    email: createCredentialsSchema(t).shape.email.pipe(z.string().max(254, t('emailInvalid'))),
    tenantId: z.string().trim().optional(),
  })
}

export type { LoginFormValues } from '../types/login'
