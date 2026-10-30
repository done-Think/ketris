import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import { normalizePostalCode } from '@shared/utils/postal-code'

import {
  propertyListingSchema,
  propertyPurposeSchema,
  propertyStatusSchema,
  propertyTypeSchema,
} from './property.schema'

export const propertyAddressInputSchema = z
  .object({
    street: z.string().trim().min(1),
    number: z.string().trim().min(1),
    complement: z.string().trim().min(1).nullable().optional(),
    neighborhood: z.string().trim().min(1),
    city: z.string().trim().min(1),
    state: z.string().trim().length(2),
    zipCode: z
      .string()
      .trim()
      .min(8)
      .refine((value) => normalizePostalCode(value) !== null, {
        ...validationRefinement('postalCodeInvalid'),
      })
      .transform((value) => normalizePostalCode(value)!)
      .openapi({
        description:
          'CEP brasileiro com 8 dígitos. Pontos, espaços e hífen são aceitos e removidos ao salvar.',
        example: '37502330',
      }),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .openapi('TenantPropertyAddressInput')

export const propertyMediaInputSchema = z
  .object({
    url: z.string().trim().min(1),
    type: z.enum(['photo', 'video', 'floorPlan']).optional(),
    position: z.number().int().nonnegative().optional(),
  })
  .openapi('TenantPropertyMediaInput')

const optionalNullableNonNegativeIntSchema = z.number().int().nonnegative().nullable().optional()
const optionalNullableNonNegativeNumberSchema = z.number().nonnegative().nullable().optional()

export const createPropertyRequestSchema = z
  .object({
    ownerId: z.string().min(1).nullable().optional(),
    ownerContactId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10000).nullable().optional(),
    purpose: propertyPurposeSchema,
    type: propertyTypeSchema,
    listing: propertyListingSchema.optional(),
    bedrooms: optionalNullableNonNegativeIntSchema,
    bathrooms: optionalNullableNonNegativeIntSchema,
    parkingSpots: optionalNullableNonNegativeIntSchema,
    areaSqm: optionalNullableNonNegativeNumberSchema,
    price: z.number().positive(),
    rentalPrice: optionalNullableNonNegativeNumberSchema,
    condoFee: optionalNullableNonNegativeNumberSchema,
    propertyTax: optionalNullableNonNegativeNumberSchema,
    address: propertyAddressInputSchema.optional(),
    media: z.array(propertyMediaInputSchema).optional(),
  })
  .openapi('CreateTenantPropertyRequest')

export const updatePropertyRequestSchema = createPropertyRequestSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    ...validationRefinement('updateRequired'),
  })
  .openapi('UpdateTenantPropertyRequest')

export const listPropertiesQuerySchema = z
  .object({
    locale: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
    sortBy: z
      .enum(['title', 'type', 'saleValue', 'rentalValue', 'status', 'broker', 'updatedAt'])
      .default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().positive().max(1000000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(25),
    search: z.string().trim().max(200).optional(),
    status: propertyStatusSchema.optional(),
    purpose: propertyPurposeSchema.optional(),
  })
  .openapi('ListTenantPropertiesQuery')

export const propertyOwnersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().max(1000000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(100),
  })
  .openapi('PropertyOwnersQuery')
