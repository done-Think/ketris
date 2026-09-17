import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail')
  .email('Informe um e-mail válido')
  .transform((value) => value.toLowerCase())

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
