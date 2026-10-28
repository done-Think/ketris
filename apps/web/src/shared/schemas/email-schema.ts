import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createEmailSchema(t: SchemaMessageTranslator<'emailRequired' | 'emailInvalid'>) {
  return z
    .string()
    .trim()
    .min(1, t('emailRequired'))
    .email(t('emailInvalid'))
    .transform((value) => value.toLowerCase())
}
