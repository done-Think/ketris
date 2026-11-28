import '@server/openapi/zod-extend'
import { z } from 'zod'

export const favoritePropertyParamsSchema = z
  .object({
    propertyId: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .openapi({ description: 'ID do imóvel.', example: 'clx1y2z3a0000abcd1234efgh' }),
  })
  .strict()

export const savedFavoritePropertySchema = z
  .object({
    propertyId: z.string(),
    savedAt: z.string().openapi({ description: 'Quando o imóvel foi salvo (ISO 8601).' }),
  })
  .openapi('SavedFavoriteProperty')
