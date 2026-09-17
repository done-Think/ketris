import '@server/openapi/zod-extend'
import { z } from 'zod'

export const propertyPurposeSchema = z.enum(['ALUGUEL', 'VENDA'])

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
    titulo: z.string(),
    descricao: z.string().nullable(),
    finalidade: propertyPurposeSchema,
    tipo: z.string(),
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
  })
  .openapi('TenantPropertiesResponse')
