import { z } from 'zod'

import { emailSchema } from '@shared/schemas/email-schema'

export const passwordRecoverySchema = z.object({
  email: emailSchema,
})

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>
