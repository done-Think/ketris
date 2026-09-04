import { z } from 'zod'

export const publicPropertyPurposeSchema = z.enum(['ALUGUEL', 'VENDA'])

export const publicPropertySearchFiltersSchema = z.object({
  purpose: publicPropertyPurposeSchema.optional(),
  propertyType: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  minBedrooms: z.number().int().nonnegative().optional(),
  q: z.string().min(1).optional(),
})

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
