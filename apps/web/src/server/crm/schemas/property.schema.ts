import '@server/openapi/zod-extend'
import { z } from 'zod'
import { crmListQuerySchema, crmPaginationSchema } from './pagination.schema'
export const crmPropertyPurposeSchema = z.enum(['RENT', 'SALE', 'BOTH'])

export const crmPropertySummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    purpose: crmPropertyPurposeSchema,
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
  .openapi('CrmPropertySummary')

export const crmPropertyAddressSchema = z.object({
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

export const crmPropertyMediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  type: z.string(),
  order: z.number().int(),
})

export const crmPropertyDetailSchema = crmPropertySummarySchema.extend({
  description: z.string().nullable(),
  address: crmPropertyAddressSchema.nullable(),
  media: z.array(crmPropertyMediaSchema),
})

export const crmPropertyQuerySchema = crmListQuerySchema
  .pick({ q: true, page: true, pageSize: true })
  .extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'RENTED', 'SOLD', 'INACTIVE']).optional() })
  .strict()
export const crmPropertyPageSchema = z.object({
  properties: z.array(crmPropertySummarySchema),
  pagination: crmPaginationSchema,
})
export const crmPropertyResponseSchema = z.object({ property: crmPropertyDetailSchema })
