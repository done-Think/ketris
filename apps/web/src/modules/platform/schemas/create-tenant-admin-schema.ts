import { z } from 'zod'

export const createTenantAdminSchema = z
  .object({
    nome: z.string().min(1, 'Informe o nome'),
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

export type CreateTenantAdminFormValues = z.infer<typeof createTenantAdminSchema>
