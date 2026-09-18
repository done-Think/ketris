import { z } from 'zod'

import { emailSchema } from './email-schema'

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
})

export type CredentialsFormValues = z.infer<typeof credentialsSchema>
