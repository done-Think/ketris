import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createPhoneSchema(t: SchemaMessageTranslator<'phoneInvalid' | 'phoneRequired'>) {
  return z
    .string()
    .trim()
    .min(1, t('phoneRequired'))
    .refine((value) => {
      const digits = value.replace(/\D/g, '')
      return digits.length === 10 || digits.length === 11
    }, t('phoneInvalid'))
}
