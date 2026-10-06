import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/schemas/email-schema'

import { createEmailSchema } from './login-schema'

const NON_BROKER_PROFILE_IDS = ['proprietario', 'imobiliaria', 'construtora', 'locatario'] as const

export function createPhoneSchema(t: SchemaMessageTranslator) {
  return z
    .string()
    .trim()
    .min(1, t('phoneRequired'))
    .refine((value) => {
      const digits = value.replace(/\D/g, '')
      return digits.length === 10 || digits.length === 11
    }, t('phoneInvalid'))
}

export function createRegistrationDetailsSchema(t: SchemaMessageTranslator) {
  const commonDetailsFields = {
    fullName: z.string().trim().min(3, t('fullNameRequired')),
    email: createEmailSchema(t),
    phone: createPhoneSchema(t),
    password: z.string().min(8, t('passwordTooShort')),
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
        profile: z.literal('corretor'),
        creci: z.string().trim().min(1, t('creciRequired')),
        agencyId: z.string().min(1).optional(),
      }),
      z.object({
        ...commonDetailsFields,
        profile: z.enum(NON_BROKER_PROFILE_IDS),
        creci: z.string().trim(),
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

export type RegistrationDetailsFormValues = z.infer<
  ReturnType<typeof createRegistrationDetailsSchema>
>
