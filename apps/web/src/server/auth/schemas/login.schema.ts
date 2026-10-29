import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema } from './user.schema'
import { locales } from '@/i18n/routing'
import { pendingEmailVerificationResponseSchema } from './email-verification.schema'

export const tenantSelectionResponseSchema = z.object({
  outcome: z.literal('SELECT_TENANT'),
  tenants: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
})

export const loginRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((value) => value.toLowerCase())
      .openapi({ example: 'admin@ketris.dev' }),
    password: z.string().min(1).openapi({ example: 'trocar-em-desenvolvimento' }),
    tenantId: z.string().trim().min(1).optional(),
    locale: z.enum(locales).default('pt-BR'),
  })
  .strict()
  .openapi('LoginRequest')

export const loginResponseSchema = z
  .object({
    user: authenticatedUserResponseSchema,
    accessToken: z.string().openapi({ description: 'JWT (HS256), válido por 1 hora.' }),
    refreshToken: z.string().openapi({
      description:
        'Token opaco de alta entropia, válido por 30 dias. Use em POST /auth/refresh para obter um novo access token.',
    }),
  })
  .or(tenantSelectionResponseSchema)
  .or(pendingEmailVerificationResponseSchema)
  .openapi('LoginResponse')
