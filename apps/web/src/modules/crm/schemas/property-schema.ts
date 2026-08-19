import { z } from 'zod'

export const publicPropertyPurposeSchema = z.enum(['ALUGUEL', 'VENDA'])

export const publicPropertySearchFiltersSchema = z.object({
  finalidade: publicPropertyPurposeSchema.optional(),
  tipo: z.string().min(1).optional(),
  cidade: z.string().min(1).optional(),
  precoMin: z.number().nonnegative().optional(),
  precoMax: z.number().nonnegative().optional(),
  quartosMin: z.number().int().nonnegative().optional(),
  q: z.string().min(1).optional(),
})

export const publicPropertySummarySchema = z.object({
  id: z.string(),
  titulo: z.string(),
  finalidade: publicPropertyPurposeSchema,
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

export const publicPropertyAddressSchema = z.object({
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

export const publicPropertyMediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  tipo: z.string(),
  ordem: z.number().int(),
})

export const publicPropertyDetailSchema = publicPropertySummarySchema.extend({
  descricao: z.string().nullable(),
  endereco: publicPropertyAddressSchema.nullable(),
  midias: z.array(publicPropertyMediaSchema),
})
