import { z } from 'zod'

export const updateAdminSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
})

export type UpdateAdminFormValues = z.infer<typeof updateAdminSchema>
