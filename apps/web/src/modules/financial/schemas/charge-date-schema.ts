import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

export function createChargeDateSchema(t: SchemaMessageTranslator) {
  return z.string().date(t('dateInvalid'))
}
