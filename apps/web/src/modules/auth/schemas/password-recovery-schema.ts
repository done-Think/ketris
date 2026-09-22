import { z } from 'zod'

import { emailSchema } from '@shared/schemas/email-schema'

export const passwordRecoverySchema = z.object({
  email: emailSchema,
})

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>

export const verificationCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Informe o código de 6 dígitos'),
})

export const passwordResetSchema = verificationCodeSchema
  .extend({
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    passwordConfirmation: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirmation'],
  })

export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>
