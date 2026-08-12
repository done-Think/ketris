import '@server/openapi/zod-extend'
import { z } from 'zod'

import { finalidadeSchema, publicPropertySummarySchema } from './property.schema'

export const searchPropertiesQuerySchema = z
  .object({
    finalidade: finalidadeSchema.optional(),
    tipo: z.string().min(1).optional(),
    cidade: z.string().min(1).optional(),
    precoMin: z.coerce.number().nonnegative().optional(),
    precoMax: z.coerce.number().nonnegative().optional(),
    quartosMin: z.coerce.number().int().nonnegative().optional(),
    q: z.string().min(1).optional(),
  })
  .openapi('SearchPropertiesQuery')

export type SearchPropertiesQueryDTO = z.infer<typeof searchPropertiesQuerySchema>

export const searchPropertiesResponseSchema = z
  .object({
    properties: z.array(publicPropertySummarySchema),
  })
  .openapi('SearchPropertiesResponse')
