import { z } from 'zod'

import { updateCurrentUserProfileSchema } from './update-current-user-profile-schema'
import { phoneSchema } from './registration-details-schema'

export const currentUserProfileSchema = updateCurrentUserProfileSchema.extend({
  phone: phoneSchema,
})

export const changeOwnPasswordSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    passwordConfirmation: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirmation'],
  })
