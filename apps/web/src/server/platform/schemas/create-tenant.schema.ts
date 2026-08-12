import '@server/openapi/zod-extend'
import { z } from 'zod'

import { tenantSummarySchema } from './tenant.schema'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const createTenantRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Imobiliária Exemplo' }),
    slug: z
      .string()
      .min(1, 'Slug é obrigatório.')
      .regex(SLUG_PATTERN, 'Slug deve conter apenas letras minúsculas, números e hífens.')
      .openapi({ example: 'imobiliaria-exemplo' }),
  })
  .openapi('CreateTenantRequest')

export type CreateTenantRequestDTO = z.infer<typeof createTenantRequestSchema>

export const createTenantResponseSchema = z
  .object({
    tenant: tenantSummarySchema,
  })
  .openapi('CreateTenantResponse')
