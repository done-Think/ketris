import '@server/openapi/zod-extend'
import { z } from 'zod'

import { publicPropertySummarySchema } from './property.schema'

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

const unavailableFavoritePropertySchema = z
  .object({
    title: z.string(),
    city: z.string().nullable(),
    neighborhood: z.string().nullable(),
  })
  .openapi('UnavailableFavoriteProperty')

export const favoritePropertyEntrySchema = z
  .discriminatedUnion('available', [
    savedFavoritePropertySchema.extend({
      available: z.literal(true),
      property: publicPropertySummarySchema,
    }),
    savedFavoritePropertySchema.extend({
      available: z.literal(false),
      property: unavailableFavoritePropertySchema,
    }),
  ])
  .openapi('FavoritePropertyEntry')

export const favoritePropertiesResponseSchema = z
  .object({
    favorites: z.array(favoritePropertyEntrySchema),
    limit: z.number().int().positive(),
  })
  .openapi('FavoritePropertiesResponse')
