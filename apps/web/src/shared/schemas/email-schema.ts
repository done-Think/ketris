import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail')
  .email('Informe um e-mail válido')
  .transform((value) => value.toLowerCase())
