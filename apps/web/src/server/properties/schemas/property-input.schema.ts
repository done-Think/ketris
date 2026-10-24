import '@server/openapi/zod-extend'
import { z } from 'zod'

import {
  propertyListingSchema,
  propertyPurposeSchema,
  propertyStatusSchema,
  propertyTypeSchema,
} from './property.schema'

export const propertyAddressInputSchema = z
  .object({
    logradouro: z.string().trim().min(1),
    numero: z.string().trim().min(1),
    complemento: z.string().trim().min(1).nullable().optional(),
    bairro: z.string().trim().min(1),
    cidade: z.string().trim().min(1),
    estado: z.string().trim().length(2),
    cep: z.string().trim().min(8),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .openapi('TenantPropertyAddressInput')

export const propertyMediaInputSchema = z
  .object({
    url: z.string().trim().min(1),
    tipo: z.string().trim().min(1).optional(),
    ordem: z.number().int().nonnegative().optional(),
  })
  .openapi('TenantPropertyMediaInput')

const optionalNullableNonNegativeIntSchema = z.number().int().nonnegative().nullable().optional()
const optionalNullableNonNegativeNumberSchema = z.number().nonnegative().nullable().optional()

export const createPropertyRequestSchema = z
  .object({
    proprietarioId: z.string().min(1).nullable().optional(),
    titulo: z.string().trim().min(1).max(200),
    descricao: z.string().trim().min(1).max(10000).nullable().optional(),
    finalidade: propertyPurposeSchema,
    tipo: propertyTypeSchema,
    anuncio: propertyListingSchema.optional(),
    quartos: optionalNullableNonNegativeIntSchema,
    banheiros: optionalNullableNonNegativeIntSchema,
    vagas: optionalNullableNonNegativeIntSchema,
    areaM2: optionalNullableNonNegativeNumberSchema,
    valor: z.number().positive(),
    valorAluguel: optionalNullableNonNegativeNumberSchema,
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
    locale: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
    sortBy: z
      .enum(['title', 'type', 'saleValue', 'rentalValue', 'status', 'broker', 'updatedAt'])
      .default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().positive().max(1000000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(25),
    search: z.string().trim().max(200).optional(),
    status: propertyStatusSchema.optional(),
    finalidade: propertyPurposeSchema.optional(),
  })
  .openapi('ListTenantPropertiesQuery')

export const propertyOwnersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().max(1000000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(100),
  })
  .openapi('PropertyOwnersQuery')
