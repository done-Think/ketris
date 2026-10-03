import { z } from 'zod'

import type { SchemaMessageTranslator } from './opportunity-schema'

export const publicPropertyPurposeSchema = z.enum(['ALUGUEL', 'VENDA'])

export function createPublicPropertySearchFiltersSchema(t: SchemaMessageTranslator) {
  return z.object({
    purpose: publicPropertyPurposeSchema.optional(),
    propertyType: z.string().min(1, t('propertyTypeInvalid')).optional(),
    city: z.string().min(1, t('cityInvalid')).optional(),
    minPrice: z.number().nonnegative(t('minPriceInvalid')).optional(),
    maxPrice: z.number().nonnegative(t('maxPriceInvalid')).optional(),
    minBedrooms: z.number().int().nonnegative(t('minBedroomsInvalid')).optional(),
    q: z.string().min(1, t('searchTermInvalid')).optional(),
  })
}

export const publicPropertySummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  purpose: publicPropertyPurposeSchema,
  propertyType: z.string(),
  price: z.number(),
  condoFee: z.number().nullable(),
  propertyTax: z.number().nullable(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  parkingSpots: z.number().int().nullable(),
  area: z.number().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  brokerName: z.string().nullable(),
  brokerAvatarUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  publishedAt: z.string().nullable(),
})

export const publicPropertyAddressSchema = z.object({
  street: z.string(),
  number: z.string(),
  complement: z.string().nullable(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

export const publicPropertyMediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  type: z.string(),
  order: z.number().int(),
})

export const publicPropertyDetailSchema = publicPropertySummarySchema.extend({
  description: z.string().nullable(),
  address: publicPropertyAddressSchema.nullable(),
  media: z.array(publicPropertyMediaSchema),
})
