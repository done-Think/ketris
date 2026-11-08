import { z } from 'zod'

import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'
import { createCnpjSchema } from '@shared/schemas/cnpj-schema'
import { createCpfSchema } from '@shared/schemas/cpf-schema'
import { createPhoneSchema } from '@shared/schemas/phone-schema'
import type { SchemaMessageTranslator } from '@shared/types'
import { createUpdateCurrentUserProfileSchema } from './update-current-user-profile-schema'

export function createCurrentUserProfileSchema(
  t: SchemaMessageTranslator<
    | 'cnpjInvalid'
    | 'cnpjRequired'
    | 'cpfInvalid'
    | 'cpfRequired'
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
  documentKind: 'cpf' | 'cnpj' = 'cpf',
) {
  return createUpdateCurrentUserProfileSchema(t).extend({
    phone: createPhoneSchema(t).pipe(z.string().max(32, t('phoneTooLong'))),
    creci: isAgent
      ? z.string().trim().min(1, t('creciRequired')).max(32, t('creciTooLong'))
      : z.string().trim().max(32, t('creciTooLong')),
    // Both fields keep the form flat; only the one that belongs to the account is validated.
    cpf: documentKind === 'cpf' ? createCpfSchema(t) : z.string(),
    cnpj: documentKind === 'cnpj' ? createCnpjSchema(t) : z.string(),
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
