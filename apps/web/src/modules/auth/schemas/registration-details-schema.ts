import { z } from 'zod'

import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'
import { createCnpjSchema } from '@shared/schemas/cnpj-schema'
import { createCpfSchema } from '@shared/schemas/cpf-schema'
import { createPhoneSchema } from '@shared/schemas/phone-schema'
import type { SchemaMessageTranslator } from '@shared/types'

import { createEmailSchema } from './login-schema'

const PERSON_PROFILE_IDS = ['owner', 'renter'] as const
const COMPANY_PROFILE_IDS = ['agency', 'developer', 'condoManager'] as const

export function createRegistrationDetailsSchema(
  t: SchemaMessageTranslator<
    | 'acceptTermsRequired'
    | 'cnpjInvalid'
    | 'cnpjRequired'
    | 'cpfInvalid'
    | 'cpfRequired'
    | 'creciRequired'
    | 'creciTooLong'
    | 'emailInvalid'
    | 'emailRequired'
    | 'emailTooLong'
    | 'fullNameRequired'
    | 'fullNameTooLong'
    | 'passwordConfirmationRequired'
    | 'passwordMismatch'
    | 'passwordTooLong'
    | 'passwordTooShort'
    | 'phoneInvalid'
    | 'phoneRequired'
    | 'phoneTooLong'
  >,
) {
  const commonDetailsFields = {
    fullName: z.string().trim().min(3, t('fullNameRequired')).max(200, t('fullNameTooLong')),
    email: createEmailSchema(t).pipe(z.string().max(254, t('emailTooLong'))),
    phone: createPhoneSchema(t).pipe(z.string().max(32, t('phoneTooLong'))),
    password: createNewPasswordSchema(t),
    passwordConfirmation: z.string().min(1, t('passwordConfirmationRequired')),
    acceptTerms: z.boolean().refine((accepted) => accepted, {
      message: t('acceptTermsRequired'),
    }),
    companyName: z.string().trim().optional(),
  }

  // Every variant carries both document fields so the form keeps one flat shape; only the
  // one that belongs to the profile is validated.
  const unusedDocument = z.string()

  return z
    .discriminatedUnion('profile', [
      z.object({
        ...commonDetailsFields,
        profile: z.literal('broker'),
        creci: z.string().trim().min(1, t('creciRequired')).max(32, t('creciTooLong')),
        agencyId: z.string().min(1).optional(),
        cpf: createCpfSchema(t),
        cnpj: unusedDocument,
      }),
      z.object({
        ...commonDetailsFields,
        profile: z.enum(PERSON_PROFILE_IDS),
        creci: z.string().trim().max(32, t('creciTooLong')),
        cpf: createCpfSchema(t),
        cnpj: unusedDocument,
      }),
      z.object({
        ...commonDetailsFields,
        profile: z.enum(COMPANY_PROFILE_IDS),
        creci: z.string().trim().max(32, t('creciTooLong')),
        cpf: unusedDocument,
        cnpj: createCnpjSchema(t),
      }),
    ])
    .superRefine((values, context) => {
      if (values.password !== values.passwordConfirmation) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('passwordMismatch'),
          path: ['passwordConfirmation'],
        })
      }
    })
}
