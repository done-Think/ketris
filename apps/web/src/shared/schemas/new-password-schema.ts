import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'
import { isSupportedNewPasswordLength } from '@shared/utils/password-length'

export function createNewPasswordSchema(
  t: SchemaMessageTranslator<'passwordTooShort' | 'passwordTooLong'>,
) {
  return z
    .string()
    .min(8, t('passwordTooShort'))
    .refine(isSupportedNewPasswordLength, t('passwordTooLong'))
}
