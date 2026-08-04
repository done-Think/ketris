import { z } from 'zod'

export const platformSignInSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

export type PlatformSignInFormValues = z.infer<typeof platformSignInSchema>
