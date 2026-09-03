import '@server/openapi/zod-extend'
import { z } from 'zod'

export const propertyPurposeSchema = z.enum(['ALUGUEL', 'VENDA'])

export const publicPropertySummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    purpose: propertyPurposeSchema,
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
    coverUrl: z.string().nullable(),
    publishedAt: z.string().nullable(),
  })
  .openapi('PublicPropertySummary')

export const propertyAddressSchema = z
  .object({
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
  .openapi('PropertyAddress')

export const propertyMediaSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    type: z.string(),
    order: z.number().int(),
  })
  .openapi('PropertyMedia')

export const publicPropertyDetailSchema = publicPropertySummarySchema
  .extend({
    description: z.string().nullable(),
    address: propertyAddressSchema.nullable(),
    media: z.array(propertyMediaSchema),
  })
  .openapi('PublicPropertyDetail')
