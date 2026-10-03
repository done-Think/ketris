import '@server/openapi/zod-extend'
import { z } from 'zod'

export const leadStageSchema = z
  .enum(['NOVO', 'EM_CONTATO', 'VISITA_MARCADA', 'PROPOSTA'])
  .openapi('LeadStage')

export const leadSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    responsavelId: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().nullable(),
    interest: z.string(),
    budget: z.string(),
    source: z.string(),
    stage: leadStageSchema,
    notes: z.string().nullable(),
    opportunityId: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .openapi('Lead')

export const listLeadsResponseSchema = z
  .object({ leads: z.array(leadSchema) })
  .openapi('ListLeadsResponse')

export const leadResponseSchema = z.object({ lead: leadSchema }).openapi('LeadResponse')

export const createLeadRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório.'),
    phone: z.string().trim().min(1, 'Telefone é obrigatório.'),
    email: z.string().trim().email('E-mail inválido.').nullable().optional(),
    interest: z.string().trim().min(1, 'Interesse é obrigatório.'),
    budget: z.string().trim().min(1, 'Orçamento é obrigatório.'),
    source: z.string().trim().min(1, 'Origem é obrigatória.'),
    notes: z.string().trim().min(1).nullable().optional(),
  })
  .openapi('CreateLeadRequest')

export const patchLeadRequestSchema = z
  .object({
    stage: leadStageSchema.optional(),
    notes: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('PatchLeadRequest')

export const convertLeadRequestSchema = z
  .object({
    propertyId: z.string().trim().min(1, 'Selecione um imóvel.'),
    proposedValue: z.number().positive('Valor proposto deve ser positivo.'),
  })
  .openapi('ConvertLeadRequest')

export const convertLeadResponseSchema = z
  .object({ lead: leadSchema, opportunityId: z.string() })
  .openapi('ConvertLeadResponse')

export type CreateLeadRequestDTO = z.infer<typeof createLeadRequestSchema>
export type PatchLeadRequestDTO = z.infer<typeof patchLeadRequestSchema>
export type ConvertLeadRequestDTO = z.infer<typeof convertLeadRequestSchema>
