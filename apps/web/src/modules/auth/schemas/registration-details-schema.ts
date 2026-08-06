import { z } from 'zod'

import { emailSchema } from './login-schema'

const NON_BROKER_PROFILE_IDS = ['proprietario', 'imobiliaria', 'construtora', 'locatario'] as const

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu telefone')
  .refine((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 10 || digits.length === 11
  }, 'Informe um telefone válido')

const commonDetailsFields = {
  fullName: z.string().trim().min(3, 'Informe seu nome completo'),
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  passwordConfirmation: z.string().min(1, 'Confirme sua senha'),
  acceptTerms: z.boolean().refine((accepted) => accepted, {
    message: 'Aceite os termos para continuar',
  }),
}

export const registrationDetailsSchema = z
  .discriminatedUnion('profile', [
    z.object({
      ...commonDetailsFields,
      profile: z.literal('corretor'),
      creci: z.string().trim().min(1, 'Informe seu CRECI'),
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
        message: 'As senhas não coincidem',
        path: ['passwordConfirmation'],
      })
    }
  })

export type RegistrationDetailsFormValues = z.infer<typeof registrationDetailsSchema>
