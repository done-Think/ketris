import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

export type SignInFormValues = z.infer<typeof signInSchema>
