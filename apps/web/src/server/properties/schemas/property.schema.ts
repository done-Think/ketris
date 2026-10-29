import '@server/openapi/zod-extend'
import { z } from 'zod'

export const propertyTypeSchema = z.enum([
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'PENTHOUSE',
  'COMMERCIAL',
  'LOFT',
  'OTHER',
])

export const propertyListingSchema = z
  .object({
    amenities: z
      .array(z.enum(['FURNISHED', 'GOURMET_BALCONY', 'PET_FRIENDLY', 'CONCIERGE_24H']))
      .max(4),
    negotiationTerms: z.string().trim().max(2000).nullable(),
    publishAfterReview: z.boolean(),
    allowWhatsappContact: z.boolean(),
    featured: z.boolean(),
  })
  .strict()
  .openapi('TenantPropertyListing')

export const propertyPurposeSchema = z.enum(['RENT', 'SALE', 'BOTH'])

export const propertyStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'RENTED', 'SOLD', 'INACTIVE'])

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
  .openapi('TenantPropertyAddress')

export const propertyMediaSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    type: z.enum(['photo', 'video', 'floorPlan']),
    position: z.number().int(),
    createdAt: z.string(),
  })
  .openapi('TenantPropertyMedia')

export const propertyValuesSchema = z
  .object({
    price: z.number(),
    rentalPrice: z.number().nullable(),
    condoFee: z.number().nullable(),
    propertyTax: z.number().nullable(),
  })
  .openapi('TenantPropertyValues')

export const propertyCharacteristicsSchema = z
  .object({
    bedrooms: z.number().int().nullable(),
    bathrooms: z.number().int().nullable(),
    parkingSpots: z.number().int().nullable(),
    areaSqm: z.number().nullable(),
  })
  .openapi('TenantPropertyCharacteristics')

export const propertySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    responsibleId: z.string(),
    responsibleName: z.string(),
    activeContractId: z.string().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    purpose: propertyPurposeSchema,
    type: propertyTypeSchema,
    ownerId: z.string().nullable(),
    listing: propertyListingSchema,
    status: propertyStatusSchema,
    publishedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    address: propertyAddressSchema.nullable(),
    media: z.array(propertyMediaSchema),
    values: propertyValuesSchema,
    characteristics: propertyCharacteristicsSchema,
  })
  .openapi('TenantProperty')

export const propertyIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const propertyResponseSchema = z
  .object({
    property: propertySchema,
  })
  .openapi('TenantPropertyResponse')

export const propertiesResponseSchema = z
  .object({
    properties: z.array(propertySchema),
    pagination: z.object({
      page: z.number().int(),
      pageSize: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
    counts: z.object({
      DRAFT: z.number().int(),
      PUBLISHED: z.number().int(),
      RENTED: z.number().int(),
      SOLD: z.number().int(),
      INACTIVE: z.number().int(),
    }),
  })
  .openapi('TenantPropertiesResponse')

export const propertyMediaUploadRequestSchema = z
  .object({
    file: z.string().openapi({
      format: 'binary',
      description: 'Imagem JPEG, PNG ou WebP, não vazia, com até 8 MiB.',
    }),
  })
  .openapi('UploadTenantPropertyMediaRequest')

export const propertyMediaUploadResponseSchema = z
  .object({
    media: z.object({
      url: z.string(),
      contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    }),
  })
  .openapi('UploadTenantPropertyMediaResponse')

export const propertyMediaKeyParamsSchema = z.object({
  key: z.string().openapi({
    description: 'Chave completa do objeto sob properties/<tenant>/<arquivo>.',
    example: 'properties/tenant-id/image.jpg',
  }),
})

export const propertyMediaBinarySchema = z.string().openapi({ format: 'binary' })

export const propertyOwnersResponseSchema = z
  .object({
    owners: z.array(z.object({ id: z.string(), name: z.string() })),
    pagination: z.object({
      page: z.number().int(),
      pageSize: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
  .openapi('PropertyOwnersResponse')

export const propertyMediaSegmentsSchema = z
  .array(
    z
      .string()
      .min(1)
      .refine((part) => part !== '.' && part !== '..' && !/[\\/%]/.test(part)),
  )
  .min(3)
  .refine((segments) => segments[0] === 'properties')
