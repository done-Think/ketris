import '@server/openapi/zod-extend'
import { z } from 'zod'

export const finalidadeSchema = z.enum(['ALUGUEL', 'VENDA'])

export const publicPropertySummarySchema = z
  .object({
    id: z.string(),
    titulo: z.string(),
    finalidade: finalidadeSchema,
    tipo: z.string(),
    valor: z.number(),
    condominio: z.number().nullable(),
    iptu: z.number().nullable(),
    quartos: z.number().int().nullable(),
    banheiros: z.number().int().nullable(),
    vagas: z.number().int().nullable(),
    areaM2: z.number().nullable(),
    cidade: z.string().nullable(),
    bairro: z.string().nullable(),
    capaUrl: z.string().nullable(),
    publicadoEm: z.string().nullable(),
  })
  .openapi('PublicPropertySummary')

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
  .openapi('PropertyAddress')

export const propertyMediaSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    tipo: z.string(),
    ordem: z.number().int(),
  })
  .openapi('PropertyMedia')

export const publicPropertyDetailSchema = publicPropertySummarySchema
  .extend({
    descricao: z.string().nullable(),
    endereco: propertyAddressSchema.nullable(),
    midias: z.array(propertyMediaSchema),
  })
  .openapi('PublicPropertyDetail')
