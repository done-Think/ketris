import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

export function createEmailSchema(t: SchemaMessageTranslator) {
  return z
    .string()
    .trim()
    .min(1, t('emailRequired'))
    .email(t('emailInvalid'))
    .transform((value) => value.toLowerCase())
}
