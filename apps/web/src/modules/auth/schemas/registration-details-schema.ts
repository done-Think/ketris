import { z } from 'zod'

import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'
import { createPhoneSchema } from '@shared/schemas/phone-schema'
import type { SchemaMessageTranslator } from '@shared/types'

import { createEmailSchema } from './login-schema'

const NON_BROKER_PROFILE_IDS = ['owner', 'agency', 'developer', 'renter'] as const

export function createRegistrationDetailsSchema(
  t: SchemaMessageTranslator<
    | 'acceptTermsRequired'
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

  return z
    .discriminatedUnion('profile', [
      z.object({
        ...commonDetailsFields,
        profile: z.literal('broker'),
        creci: z.string().trim().min(1, t('creciRequired')).max(32, t('creciTooLong')),
        agencyId: z.string().min(1).optional(),
      }),
      z.object({
        ...commonDetailsFields,
        profile: z.enum(NON_BROKER_PROFILE_IDS),
        creci: z.string().trim().max(32, t('creciTooLong')),
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
