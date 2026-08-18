import { z } from 'zod'

import { emailSchema } from './login-schema'

export const passwordRecoverySchema = z.object({
  email: emailSchema,
})

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>
