import { z } from 'zod'

export const updatePlatformAdminSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']),
})

export type UpdatePlatformAdminFormValues = z.infer<typeof updatePlatformAdminSchema>
