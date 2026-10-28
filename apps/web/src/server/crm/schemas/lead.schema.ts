import { crmDateSchema } from './crm-date.schema'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import {
  crmEmailSchema,
  crmNameSchema,
  crmNotesSchema,
  crmPhoneSchema,
  crmProposedValueSchema,
  crmShortTextSchema,
} from './crm-input.schema'
import { LEAD_SOURCES } from '../constants/lead-sources'
import { crmGroupsSchema, crmListQuerySchema, crmPaginationSchema } from './pagination.schema'

export const leadStageSchema = z
  .enum(['NEW', 'IN_CONTACT', 'VISIT_SCHEDULED', 'PROPOSAL'])
  .openapi('LeadStage')

export const leadSourceSchema = z.enum(LEAD_SOURCES).openapi('LeadSource')

export const leadSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    responsibleId: z.string(),
    responsibleName: z.string().optional(),
    name: z.string(),
    phone: z.string(),
    email: z.string().nullable(),
    interest: z.string(),
    budget: z.string(),
    source: leadSourceSchema,
    stage: leadStageSchema,
    notes: z.string().nullable(),
    opportunityId: z.string().nullable(),
    createdAt: crmDateSchema,
    updatedAt: crmDateSchema,
  })
  .openapi('Lead')

export const listLeadsQuerySchema = crmListQuerySchema
  .extend({
    stage: leadStageSchema.optional(),
    sortBy: z
      .enum(['name', 'interest', 'budget', 'stage', 'source', 'lastContact', 'createdAt'])
      .optional(),
  })
  .strict()

export const listLeadsResponseSchema = z
  .object({ leads: z.array(leadSchema), pagination: crmPaginationSchema, groups: crmGroupsSchema })
  .openapi('ListLeadsResponse')

export const leadResponseSchema = z.object({ lead: leadSchema }).openapi('LeadResponse')

export const createLeadRequestSchema = z
  .object({
    name: crmNameSchema,
    phone: crmPhoneSchema,
    email: crmEmailSchema.nullable().optional(),
    interest: crmShortTextSchema,
    budget: crmShortTextSchema,
    source: leadSourceSchema,
    notes: crmNotesSchema.nullable().optional(),
  })
  .strict()
  .openapi('CreateLeadRequest')

export const patchLeadRequestSchema = z
  .object({
    stage: leadStageSchema.optional(),
    notes: crmNotesSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('PatchLeadRequest')

export const convertLeadRequestSchema = z
  .object({
    propertyId: z.string().trim().min(1, 'Selecione um imóvel.'),
    proposedValue: crmProposedValueSchema,
    email: crmEmailSchema.optional(),
  })
  .strict()
  .openapi('ConvertLeadRequest')

export const convertLeadResponseSchema = z
  .object({ lead: leadSchema, opportunityId: z.string() })
  .openapi('ConvertLeadResponse')
