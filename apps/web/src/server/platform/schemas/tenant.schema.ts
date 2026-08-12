import '@server/openapi/zod-extend'
import { z } from 'zod'

export const tenantSummarySchema = z
  .object({
    id: z.string(),
    nome: z.string(),
    slug: z.string(),
    createdAt: z.string().openapi({ description: 'ISO 8601', example: '2026-08-04T12:00:00.000Z' }),
  })
  .openapi('TenantSummary')
