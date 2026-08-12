import { z } from 'zod'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const createTenantSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  slug: z
    .string()
    .min(1, 'Informe o slug')
    .regex(SLUG_PATTERN, 'Use apenas letras minúsculas, números e hífens'),
})

export type CreateTenantFormValues = z.infer<typeof createTenantSchema>
