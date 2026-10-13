import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema } from '@server/auth/schemas/user.schema'

const registerBaseFields = {
  fullName: z.string().trim().min(1, 'Nome é obrigatório.').openapi({ example: 'Ana Agente' }),
  email: z.string().trim().email('E-mail inválido.').openapi({ example: 'ana@ketris.dev' }),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .openapi({ example: 'trocar-em-desenvolvimento' }),
}

export const registerRequestSchema = z
  .discriminatedUnion('profile', [
    z.object({
      ...registerBaseFields,
      profile: z.enum(['proprietario', 'imobiliaria', 'construtora']),
      companyName: z.string().trim().min(1).optional(),
    }),
    z.object({
      ...registerBaseFields,
      profile: z.literal('corretor'),
      companyName: z.string().trim().min(1).optional(),
      agencyId: z.string().min(1).optional(),
    }),
    z.object({
      ...registerBaseFields,
      profile: z.literal('locatario'),
    }),
  ])
  .openapi('RegisterRequest')

export type RegisterRequestDTO = z.infer<typeof registerRequestSchema>

export const registerResponseSchema = z
  .discriminatedUnion('outcome', [
    z.object({
      outcome: z.literal('REGISTERED'),
      user: authenticatedUserResponseSchema,
      accessToken: z.string(),
      refreshToken: z.string(),
    }),
    z.object({
      outcome: z.literal('PENDING_APPROVAL'),
      email: z.string().email(),
    }),
  ])
  .openapi('RegisterResponse')
