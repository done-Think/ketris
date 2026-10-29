import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const createPlatformAdminRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Nome é obrigatório.')
      .max(120, 'Nome muito longo.')
      .openapi({ example: 'Sócio Ketris' }),
    email: z
      .string()
      .trim()
      .max(254, 'E-mail inválido.')
      .email('E-mail inválido.')
      .openapi({ example: 'socio@ketris.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .max(128, 'Senha muito longa.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
    role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']).openapi({ example: 'ADMIN' }),
  })
  .strict()
  .openapi('CreatePlatformAdminRequest')

export const createPlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('CreatePlatformAdminResponse')
