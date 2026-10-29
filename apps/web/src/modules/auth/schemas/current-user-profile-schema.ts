import { z } from 'zod'

import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'
import { createPhoneSchema } from '@shared/schemas/phone-schema'
import type { SchemaMessageTranslator } from '@shared/types'
import { createUpdateCurrentUserProfileSchema } from './update-current-user-profile-schema'

export function createCurrentUserProfileSchema(
  t: SchemaMessageTranslator<
    | 'creciRequired'
    | 'creciTooLong'
    | 'emailInvalid'
    | 'emailTooLong'
    | 'nameRequired'
    | 'nameTooLong'
    | 'phoneInvalid'
    | 'phoneRequired'
    | 'phoneTooLong'
  >,
  isAgent = false,
) {
  return createUpdateCurrentUserProfileSchema(t).extend({
    phone: createPhoneSchema(t).pipe(z.string().max(32, t('phoneTooLong'))),
    creci: isAgent
      ? z.string().trim().min(1, t('creciRequired')).max(32, t('creciTooLong'))
      : z.string().trim().max(32, t('creciTooLong')),
    avatarFile: z.custom<File | null>((file) => file === null || file instanceof File),
  })
}

export function createChangeOwnPasswordSchema(
  t: SchemaMessageTranslator<
    | 'currentPasswordRequired'
    | 'passwordConfirmationRequired'
    | 'passwordMismatch'
    | 'passwordTooLong'
    | 'passwordTooShort'
  >,
) {
  return z
    .object({
      currentPassword: z.string().min(1, t('currentPasswordRequired')),
      password: createNewPasswordSchema(t),
      passwordConfirmation: z.string().min(1, t('passwordConfirmationRequired')),
    })
    .refine((values) => values.password === values.passwordConfirmation, {
      message: t('passwordMismatch'),
      path: ['passwordConfirmation'],
    })
}
