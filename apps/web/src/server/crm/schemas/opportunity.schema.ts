import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import { crmDateSchema } from './crm-date.schema'
import {
  crmEmailSchema,
  crmNameSchema,
  crmNotesSchema,
  crmPhoneSchema,
  crmProposedValueSchema,
  crmShortTextSchema,
} from './crm-input.schema'
import { crmGroupsSchema, crmListQuerySchema, crmPaginationSchema } from './pagination.schema'
import { crmPropertySummarySchema } from './property.schema'

export const opportunityStatusSchema = z
  .enum(['DRAFT', 'SENT', 'IN_NEGOTIATION', 'ACCEPTED', 'REJECTED'])
  .openapi('OpportunityStatus')

export const guaranteeTypeSchema = z
  .enum(['GUARANTOR', 'DEPOSIT', 'SURETY_BOND', 'NONE'])
  .openapi('GuaranteeType')

export const opportunitySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    propertyId: z.string(),
    responsibleId: z.string(),
    responsibleName: z.string(),
    property: crmPropertySummarySchema.optional(),
    contactId: z.string().nullable(),
    leadName: z.string(),
    leadEmail: z.string().email(),
    leadPhone: z.string().nullable(),
    proposedValue: z.number(),
    contractTermMonths: z.number().int().nullable(),
    desiredStartDate: z.coerce.date().nullable(),
    guaranteeType: guaranteeTypeSchema,
    specialConditions: z.array(z.string()),
    notes: z.string().nullable(),
    status: opportunityStatusSchema,
    archivedAt: z.coerce.date().nullable(),
    createdAt: crmDateSchema,
    updatedAt: crmDateSchema,
  })
  .openapi('Opportunity')

export const listOpportunitiesQuerySchema = z
  .object({
    ...crmListQuerySchema.shape,
    summaryScope: z.enum(['all', 'results']).optional(),
    sortBy: z
      .enum(['name', 'property', 'proposedValue', 'status', 'createdAt', 'updatedAt'])
      .optional(),
    statuses: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.array(opportunityStatusSchema))
      .optional(),
    status: opportunityStatusSchema.optional(),
    contactId: z.string().optional(),
    includeArchived: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict()
  .openapi('ListOpportunitiesQuery')

export const listOpportunitiesResponseSchema = z
  .object({
    opportunities: z.array(opportunitySchema),
    pagination: crmPaginationSchema,
    groups: crmGroupsSchema,
  })
  .openapi('ListOpportunitiesResponse')

export const opportunityResponseSchema = z
  .object({ opportunity: opportunitySchema })
  .openapi('OpportunityResponse')

const leadName = crmNameSchema
const leadEmail = crmEmailSchema
const leadPhone = crmPhoneSchema.nullable()
const proposedValue = crmProposedValueSchema
const contractTermMonths = z.number().int().positive().max(2_147_483_647).nullable()
const desiredStartDate = crmDateSchema.nullable()
const specialConditions = z.array(crmShortTextSchema)
const notes = crmNotesSchema.nullable()
const contactId = z.string().min(1).nullable()

export const createOpportunityRequestSchema = z
  .object({
    propertyId: z.string().min(1),
    responsibleId: z.string().min(1).max(64).optional(),
    contactId: z.string().min(1).optional(),
    leadName,
    leadEmail,
    leadPhone: leadPhone.optional(),
    proposedValue,
    contractTermMonths: contractTermMonths.optional(),
    desiredStartDate: desiredStartDate.optional(),
    guaranteeType: guaranteeTypeSchema.optional(),
    specialConditions: specialConditions.optional(),
    notes: notes.optional(),
    status: z.enum(['DRAFT', 'SENT']).optional(),
  })
  .strict()
  .openapi('CreateOpportunityRequest')

export const patchOpportunityRequestSchema = z
  .object({
    contactId: contactId.optional(),
    leadName: leadName.optional(),
    leadEmail: leadEmail.optional(),
    leadPhone: leadPhone.optional(),
    proposedValue: proposedValue.optional(),
    contractTermMonths: contractTermMonths.optional(),
    desiredStartDate: desiredStartDate.optional(),
    guaranteeType: guaranteeTypeSchema.optional(),
    specialConditions: specialConditions.optional(),
    notes: notes.optional(),
    status: opportunityStatusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    ...validationRefinement('updateRequired'),
  })
  .openapi('PatchOpportunityRequest')

export const assignOpportunityResponsibleRequestSchema = z
  .object({ responsibleId: z.string().min(1).max(64) })
  .strict()
  .openapi('AssignOpportunityResponsibleRequest')

export const deleteOpportunityQuerySchema = z
  .object({
    permanent: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict()
  .openapi('DeleteOpportunityQuery')

export const opportunityResponsibleSchema = z
  .object({ id: z.string(), name: z.string(), role: z.enum(['OWNER', 'AGENT']) })
  .openapi('OpportunityResponsible')

export const listOpportunityResponsiblesResponseSchema = z
  .object({ responsibles: z.array(opportunityResponsibleSchema) })
  .openapi('ListOpportunityResponsiblesResponse')
