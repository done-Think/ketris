import '@server/openapi/zod-extend'
import { z } from 'zod'

import { propertyPurposeSchema, propertyStatusSchema } from './property.schema'

export const propertyAddressInputSchema = z
  .object({
    logradouro: z.string().trim().min(1),
    numero: z.string().trim().min(1),
    complemento: z.string().trim().min(1).nullable().optional(),
    bairro: z.string().trim().min(1),
    cidade: z.string().trim().min(1),
    estado: z.string().trim().length(2),
    cep: z.string().trim().min(8),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .openapi('TenantPropertyAddressInput')

export const propertyMediaInputSchema = z
  .object({
    url: z.string().trim().url(),
    tipo: z.string().trim().min(1).optional(),
    ordem: z.number().int().nonnegative().optional(),
  })
  .openapi('TenantPropertyMediaInput')

const optionalNullableNonNegativeIntSchema = z.number().int().nonnegative().nullable().optional()
const optionalNullableNonNegativeNumberSchema = z.number().nonnegative().nullable().optional()

export const createPropertyRequestSchema = z
  .object({
    titulo: z.string().trim().min(1),
    descricao: z.string().trim().min(1).nullable().optional(),
    finalidade: propertyPurposeSchema,
    tipo: z.string().trim().min(1),
    quartos: optionalNullableNonNegativeIntSchema,
    banheiros: optionalNullableNonNegativeIntSchema,
    vagas: optionalNullableNonNegativeIntSchema,
    areaM2: optionalNullableNonNegativeNumberSchema,
    valor: z.number().positive(),
    condominio: optionalNullableNonNegativeNumberSchema,
    iptu: optionalNullableNonNegativeNumberSchema,
    endereco: propertyAddressInputSchema.optional(),
    midias: z.array(propertyMediaInputSchema).optional(),
  })
  .openapi('CreateTenantPropertyRequest')

export const updatePropertyRequestSchema = createPropertyRequestSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  })
  .openapi('UpdateTenantPropertyRequest')

export const listPropertiesQuerySchema = z
  .object({
    status: propertyStatusSchema.optional(),
    finalidade: propertyPurposeSchema.optional(),
  })
  .openapi('ListTenantPropertiesQuery')

export type CreatePropertyRequestDTO = z.infer<typeof createPropertyRequestSchema>
export type UpdatePropertyRequestDTO = z.infer<typeof updatePropertyRequestSchema>
export type ListPropertiesQueryDTO = z.infer<typeof listPropertiesQuerySchema>
