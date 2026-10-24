import '@server/openapi/zod-extend'
import { z } from 'zod'

export const propertyTypeSchema = z.enum([
  'APARTAMENTO',
  'CASA',
  'STUDIO',
  'COBERTURA',
  'COMERCIAL',
  'LOFT',
  'OUTRO',
])

export const propertyListingSchema = z
  .object({
    comodidades: z
      .array(z.enum(['MOBILIADO', 'VARANDA_GOURMET', 'ACEITA_PETS', 'PORTARIA_24H']))
      .max(4),
    condicoesNegociacao: z.string().trim().max(2000).nullable(),
    publicarAposRevisao: z.boolean(),
    permiteContatoWhatsapp: z.boolean(),
    destaque: z.boolean(),
  })
  .strict()
  .openapi('TenantPropertyListing')

export const propertyPurposeSchema = z.enum(['ALUGUEL', 'VENDA', 'AMBOS'])

export const propertyStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'RENTED', 'SOLD', 'INACTIVE'])

export const propertyAddressSchema = z
  .object({
    logradouro: z.string(),
    numero: z.string(),
    complemento: z.string().nullable(),
    bairro: z.string(),
    cidade: z.string(),
    estado: z.string(),
    cep: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
  })
  .openapi('TenantPropertyAddress')

export const propertyMediaSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    tipo: z.string(),
    ordem: z.number().int(),
    createdAt: z.string(),
  })
  .openapi('TenantPropertyMedia')

export const propertyValuesSchema = z
  .object({
    valor: z.number(),
    valorAluguel: z.number().nullable(),
    condominio: z.number().nullable(),
    iptu: z.number().nullable(),
  })
  .openapi('TenantPropertyValues')

export const propertyCharacteristicsSchema = z
  .object({
    quartos: z.number().int().nullable(),
    banheiros: z.number().int().nullable(),
    vagas: z.number().int().nullable(),
    areaM2: z.number().nullable(),
  })
  .openapi('TenantPropertyCharacteristics')

export const propertySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    responsavelId: z.string(),
    responsavelNome: z.string(),
    activeContractId: z.string().nullable(),
    titulo: z.string(),
    descricao: z.string().nullable(),
    finalidade: propertyPurposeSchema,
    tipo: propertyTypeSchema,
    proprietarioId: z.string().nullable(),
    anuncio: propertyListingSchema,
    status: propertyStatusSchema,
    publicadoEm: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    endereco: propertyAddressSchema.nullable(),
    midias: z.array(propertyMediaSchema),
    valores: propertyValuesSchema,
    caracteristicas: propertyCharacteristicsSchema,
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
